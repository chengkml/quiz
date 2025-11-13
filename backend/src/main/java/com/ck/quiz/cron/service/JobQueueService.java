package com.ck.quiz.cron.service;

import com.ck.quiz.cron.domain.JobQueue;
import com.ck.quiz.cron.domain.PendingJob;
import com.ck.quiz.cron.dto.JobQueueDto;
import com.ck.quiz.cron.repository.JobQueueRepository;
import com.ck.quiz.cron.repository.PendingJobRepository;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class JobQueueService {

    @Autowired
    private JobQueueRepository jobQueueRepo;

    @Autowired
    private PendingJobRepository pendingJobRepo;

    @Autowired
    private NamedParameterJdbcTemplate jt;

    /**
     * 分页查询队列
     */
    public Page<JobQueueDto> searchQueues(int limit, int offset, String keyWord) {
        Map<String, Object> params = new HashMap<>();
        StringBuilder listSql = new StringBuilder("select * from synth_job_queue where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(*) from synth_job_queue where 1=1 ");

        // 模糊查询
        JdbcQueryHelper.lowerLike("keyWord", keyWord, "and (lower(queue_name) like :keyWord or lower(queue_label) like :keyWord)", params, jt, listSql, countSql);

        int pageSize = limit;
        int pageNum = offset / pageSize;

        String limitSql = JdbcQueryHelper.getLimitSql(jt, listSql.toString(), pageNum, pageSize);
        List<Map<String, Object>> list = HumpHelper.lineToHump(jt.queryForList(limitSql, params));

        // 转 DTO
        List<JobQueueDto> dtoList = new ArrayList<>();
        list.forEach(map -> {
            JobQueueDto dto = new JobQueueDto();
            dto.setId((String) map.get("id"));
            dto.setQueueName((String) map.get("queueName"));
            dto.setQueueLabel((String) map.get("queueLabel"));
            dto.setQueueSize(map.get("queueSize") == null ? 0 : ((Number) map.get("queueSize")).intValue());
            dto.setState((String) map.get("state"));
            dto.setCreateTime((LocalDateTime) map.get("createTime"));
            dtoList.add(dto);
        });

        return JdbcQueryHelper.toPage(jt, countSql.toString(), params, dtoList, pageNum, pageSize);
    }

    /**
     * 删除队列
     */
    public String deleteQueue(String id) {
        Optional<JobQueue> optional = jobQueueRepo.findById(id);
        if (!optional.isPresent()) {
            throw new RuntimeException("队列不存在");
        }
        List<PendingJob> pendingJobs = pendingJobRepo.findByQueueName(optional.get().getQueueName());
        if (!pendingJobs.isEmpty()) {
            throw new RuntimeException("队列中仍存在未处理的Job");
        }
        jobQueueRepo.deleteById(id);
        return id;
    }

    public boolean checkQueueNameUniq(String id, String queueName) {
        if (id == null || id.isEmpty()) {
            // 新增：只要存在相同名称就返回 false
            return !jobQueueRepo.existsByQueueName(queueName);
        } else {
            // 更新：排除自己
            return !jobQueueRepo.existsByQueueNameAndIdNot(queueName, id);
        }
    }

    /**
     * 保存或更新队列
     */
    public JobQueue createQueue(JobQueue jobQueue) {
        jobQueue.setId(IdHelper.genUuid());
        jobQueue.setCreateTime(LocalDateTime.now());
        jobQueueRepo.save(jobQueue);
        return jobQueue;
    }

    /**
     * 获取所有队列（不分页）
     */
    public List<JobQueueDto> listQueues() {
        List<JobQueue> entities = jobQueueRepo.findByState("1");
        List<JobQueueDto> dtoList = new ArrayList<>();
        for (JobQueue entity : entities) {
            JobQueueDto dto = new JobQueueDto();
            dto.setId(entity.getId());
            dto.setQueueName(entity.getQueueName());
            dto.setQueueLabel(entity.getQueueLabel());
            dto.setQueueSize(entity.getQueueSize());
            dto.setState(entity.getState());
            dto.setCreateTime(entity.getCreateTime());
            dtoList.add(dto);
        }
        return dtoList;
    }

    /**
     * 禁用队列
     */
    public String disableQueue(String id) {
        Optional<JobQueue> optional = jobQueueRepo.findById(id);
        if (!optional.isPresent()) {
            throw new RuntimeException("队列不存在");
        }
        JobQueue queue = optional.get();
        queue.setState("0");
        jobQueueRepo.save(queue);
        return id;
    }

    /**
     * 启用队列
     */
    public String enableQueue(String id) {
        Optional<JobQueue> optional = jobQueueRepo.findById(id);
        if (!optional.isPresent()) {
            throw new RuntimeException("队列不存在");
        }
        JobQueue queue = optional.get();
        queue.setState("1");
        jobQueueRepo.save(queue);
        return id;
    }

    /**
     * 更新队列大小
     */
    public String updateQueueSize(String id, int size) {
        Optional<JobQueue> optional = jobQueueRepo.findById(id);
        if (!optional.isPresent()) {
            throw new RuntimeException("队列不存在");
        }
        JobQueue queue = optional.get();
        queue.setQueueSize(size);
        jobQueueRepo.save(queue);
        return id;
    }

}
