package com.ck.quiz.cron.service;

import com.ck.quiz.cron.domain.CronTask;
import com.ck.quiz.cron.domain.JobQueue;
import com.ck.quiz.cron.dto.CronTaskDto;
import com.ck.quiz.cron.repository.CronTaskRepository;
import com.ck.quiz.cron.repository.JobQueueRepository;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;


@Slf4j
@Service
public class CronTaskService {

    @Autowired
    private DynamicCronTaskScheduler taskScheduler;

    @Autowired
    private CronTaskRepository cronJobRepo;

    @Autowired
    private JobQueueRepository jobQueueRepo;

    @Autowired
    private DynamicCronTaskScheduler scheduler;

    @Autowired
    private NamedParameterJdbcTemplate jt;

    /**
     * 分页查询定时任务
     */
    public Page<CronTaskDto> getCronTaskList(int offset, int limit, String queueName, String state, String keyWord) {
        Map<String, Object> params = new HashMap<>();

        StringBuilder listSql = new StringBuilder("select * from cron_task where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(*) from cron_task where 1=1 ");
        JdbcQueryHelper.equals("queueName", queueName, "and queue_name = :queueName ", params, listSql, countSql);
        JdbcQueryHelper.equals("state", state, "and state = :state ", params, listSql, countSql);

        JdbcQueryHelper.lowerLike("keyWord", keyWord, "and (lower(name) like :keyWord or lower(label) like :keyWord) ", params, jt, listSql, countSql);

        // 分页
        int pageSize = limit;
        int pageNum = offset / pageSize;
        String limitSql = JdbcQueryHelper.getLimitSql(jt, listSql.toString(), pageNum, pageSize);

        // 查询数据
        List<Map<String, Object>> rows = HumpHelper.lineToHump(jt.queryForList(limitSql, params));

        List<CronTaskDto> dtoList = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            CronTaskDto dto = new CronTaskDto();
            dto.setId(MapUtils.getString(row, "id"));
            dto.setName(MapUtils.getString(row, "name"));
            dto.setLabel(MapUtils.getString(row, "label"));
            dto.setCronExpression(MapUtils.getString(row, "cronExpression"));
            dto.setState(MapUtils.getString(row, "state"));
            dto.setQueueName(MapUtils.getString(row, "queueName"));
            dto.setTaskClass(MapUtils.getString(row, "taskClass"));
            dto.setFireParams(MapUtils.getString(row, "fireParams"));
            dto.setNextFireTime(MapUtils.getString(row, "nextFireTime"));
            dtoList.add(dto);
        }

        return JdbcQueryHelper.toPage(jt, countSql.toString(), params, dtoList, pageNum, pageSize);
    }


    /**
     * 删除定时任务
     *
     * @param idList 待删除任务ID列表
     */
    public List<String> cronTaskDelete(List<String> idList) {
        List<String> deleteIds = new ArrayList<>();
        for (String id : idList) {
            taskScheduler.cancelTask(id);
            jt.update("delete from cron_task where id=:id", Collections.singletonMap("id", id));
            deleteIds.add(id);
        }
        return deleteIds;
    }

    @Transactional
    public CronTask saveCronJob(CronTaskDto cronTaskDto) {
        // 生成或获取任务ID
        String id = cronTaskDto.getId();
        if (id == null || id.isEmpty()) {
            id = IdHelper.genUuid();
            cronTaskDto.setId(id);
        }

        // DTO -> Entity
        CronTask cronTask = new CronTask();
        cronTask.setId(cronTaskDto.getId());
        cronTask.setName(cronTaskDto.getName());
        cronTask.setLabel(cronTaskDto.getLabel());
        cronTask.setCronExpression(cronTaskDto.getCronExpression());
        cronTask.setState(cronTaskDto.getState());
        cronTask.setTaskClass(cronTaskDto.getTaskClass());
        cronTask.setFireParams(cronTaskDto.getFireParams());
        cronTask.setQueueName(cronTaskDto.getQueueName());

        // 校验父任务
        if (cronTask.getQueueName() != null && !cronTask.getQueueName().isEmpty()) {
            JobQueue queue = jobQueueRepo.findByQueueName(cronTask.getQueueName());
            if (queue == null) {
                throw new RuntimeException("队列不存在，无法注册任务");
            }
            // 保存任务，不注册定时器
            return cronJobRepo.save(cronTask);
        }

        // 更新操作：如果存在同ID任务，先取消定时器
        if (cronJobRepo.existsById(cronTask.getId())) {
            taskScheduler.cancelTask(cronTask.getId());
        }

        // 保存新任务
        CronTask savedJob = cronJobRepo.save(cronTask);

        // 注册定时器（只有非子任务注册）
        taskScheduler.registerTask(cronTaskDto);

        return savedJob;
    }

    public String triggerById(String id) {
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        List<Map<String, Object>> list = HumpHelper.lineToHump(jt.queryForList("select * from cron_task where id = :id ", params));
        if (list.isEmpty()) {
            throw new RuntimeException("未查询到任务ID【" + id + "】对应的任务信息!");
        }
        DynamicCronTaskScheduler.executor.execute(scheduler.createTaskRunner(list.get(0)));
        return id;
    }
}
