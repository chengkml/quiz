package com.ck.quiz.script.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.script.dto.ScriptInfoCreateDto;
import com.ck.quiz.script.dto.ScriptInfoDto;
import com.ck.quiz.script.dto.ScriptInfoQueryDto;
import com.ck.quiz.script.dto.ScriptInfoUpdateDto;
import com.ck.quiz.script.entity.ScriptInfo;
import com.ck.quiz.script.entity.ScriptJob;
import com.ck.quiz.script.repository.ScriptInfoRepository;
import com.ck.quiz.script.repository.ScriptJobRepository;
import com.ck.quiz.script.service.ScriptInfoService;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.ck.quiz.utils.IdHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@Transactional
public class ScriptInfoServiceImpl extends
        BaseServiceImpl<ScriptInfoCreateDto, ScriptInfoUpdateDto, ScriptInfoQueryDto, ScriptInfoDto, ScriptInfo, ScriptInfoRepository>
        implements ScriptInfoService {

    @Autowired
    private ScriptInfoRepository scriptInfoRepository;

    @Autowired
    private ScriptJobRepository jobRepo;

    @Override
    public Page<ScriptInfoDto> search(String userId, ScriptInfoQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select s.* from script_info s where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from script_info s where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 按名称/编码模糊查询
        JdbcQueryHelper.lowerLike("keyWord", queryDto.getKeyWord(),
                " and (lower(s.script_name) like :keyWord or lower(s.script_code) like :keyWord) ", params,
                namedParameterJdbcTemplate, sql, countSql);

        // 排序
        JdbcQueryHelper.order("create_date", "desc", sql);

        // 分页SQL
        String limitSql = JdbcQueryHelper.getLimitSql(
                namedParameterJdbcTemplate,
                sql.toString(),
                queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        java.util.List<ScriptInfoDto> scripts = namedParameterJdbcTemplate.query(
                limitSql,
                params,
                (rs, rowNum) -> {
                    ScriptInfoDto s = new ScriptInfoDto();
                    s.setId(rs.getString("id"));
                    s.setScriptCode(rs.getString("script_code"));
                    s.setScriptName(rs.getString("script_name"));
                    s.setRemoteScript(rs.getString("remote_script"));
                    s.setHost(rs.getString("host"));
                    s.setPort(rs.getInt("port"));
                    s.setUsername(rs.getString("username"));
                    s.setPassword(rs.getString("password"));
                    s.setExecCmd(rs.getString("exec_cmd"));
                    s.setState(ScriptInfo.State.valueOf(rs.getString("state")));
                    s.setCreateUser(rs.getString("create_user"));
                    s.setCreateDate(rs.getTimestamp("create_date").toLocalDateTime());
                    s.setUpdateDate(
                            rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime()
                                    : null);
                    return s;
                });

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                scripts,
                queryDto.getPageNum(),
                queryDto.getPageSize());
    }

    @Override
    public ScriptInfoDto getScriptInfoByCode(String scriptCode) {
        ScriptInfo entity = scriptInfoRepository.findByScriptCode(scriptCode);
        return convertToDto(entity, true);
    }

    @Autowired
    private com.ck.quiz.cron.service.JobService jobService;

    @Autowired
    private com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Override
    @Transactional
    public void execScript(String id, String queueId) {
        ScriptInfo entity = scriptInfoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("脚本信息不存在"));

        try {
            String taskClass;
            Map<String, Object> taskParams = new HashMap<>();

            // 判断是否远程脚本
            boolean isRemote = "true".equalsIgnoreCase(entity.getRemoteScript())
                    || "1".equals(entity.getRemoteScript());

            if (isRemote) {
                taskClass = com.ck.quiz.cron.exec.RemoteScriptExecJob.class.getName();
                taskParams.put("host", entity.getHost());
                taskParams.put("port", entity.getPort());
                taskParams.put("username", entity.getUsername());
                taskParams.put("password", entity.getPassword());
            } else {
                taskClass = com.ck.quiz.cron.exec.LocalScriptExecJob.class.getName();
            }

            taskParams.put("cmd", entity.getExecCmd());
            taskParams.put("scriptId", entity.getId()); // 关联ID

            com.ck.quiz.cron.dto.JobDto jobDto = new com.ck.quiz.cron.dto.JobDto();
            jobDto.setTaskClass(taskClass);
            jobDto.setTaskParams(objectMapper.writeValueAsString(taskParams));
            jobDto.setQueueName(queueId);

            // 调用 JobService 创建作业
            String jobId = jobService.addJob(jobDto);

            // 保存 ScriptJob 关联
            ScriptJob scriptJob = new ScriptJob();
            scriptJob.setId(IdHelper.genUuid());
            scriptJob.setScriptId(id);
            scriptJob.setJobId(jobId);
            jobRepo.save(scriptJob);

        } catch (Exception e) {
            log.error("执行脚本失败: {}", e.getMessage(), e);
            throw new RuntimeException("执行脚本失败: " + e.getMessage());
        }
    }

    @Override
    public Page<Map<String, Object>> searchJobs(int offset, int limit, String scriptId, String state, String taskClass,
            String queueName, String triggerType, String startTimeLt, String startTimeGt, String taskId,
            String keyWord) {
        // 通过 ScriptJob 关联查询脚本对应的所有 Job 记录
        StringBuilder sql = new StringBuilder(
                "select j.*,q.queue_label from job j " +
                        "left join job_queue q on j.queue_name = q.queue_name " +
                        "inner join script_job sj on j.id = sj.job_id " +
                        "where sj.script_id = :scriptId ");
        StringBuilder countSql = new StringBuilder("select count(*) from job j " +
                "inner join script_job sj on j.id = sj.job_id " +
                "where sj.script_id = :scriptId ");

        Map<String, Object> params = new HashMap<>();
        params.put("scriptId", scriptId);

        // 状态过滤
        JdbcQueryHelper.equals("state", state, "and j.state = :state ", params, sql, countSql);

        JdbcQueryHelper.equals("taskClass", taskClass, "and j.task_class = :taskClass ", params, sql, countSql);

        JdbcQueryHelper.equals("queueName", queueName, "and j.queue_name = :queueName ", params, sql, countSql);

        JdbcQueryHelper.equals("triggerType", triggerType, "and j.trigger_type = :triggerType ", params, sql, countSql);

        // 任务ID过滤
        JdbcQueryHelper.equals("taskId", taskId, "and j.task_id = :taskId ", params, sql, countSql);

        // 关键字搜索
        JdbcQueryHelper.lowerLike("keyWord", keyWord, "and lower(j.id) like :keyWord ", params,
                namedParameterJdbcTemplate, sql, countSql);

        // 排序
        sql.append(" order by j.create_time desc ");

        // 分页
        int pageSize = limit;
        int pageNum = offset / pageSize;
        String limitSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), pageNum, pageSize);

        // 查询数据
        java.util.List<Map<String, Object>> rows = namedParameterJdbcTemplate.queryForList(limitSql, params);

        // 组装分页对象
        return JdbcQueryHelper.toPage(
                namedParameterJdbcTemplate,
                countSql.toString(),
                params,
                rows,
                pageNum,
                pageSize);
    }

    @Override
    @Transactional
    public void deleteJob(String id) {
        jobRepo.findByJobId(id).ifPresent(job -> {
            jobRepo.delete(job);
        });
    }

    @Override
    protected ScriptInfoDto newDto() {
        return new ScriptInfoDto();
    }

    @Override
    protected ScriptInfo newModel() {
        return new ScriptInfo();
    }
}