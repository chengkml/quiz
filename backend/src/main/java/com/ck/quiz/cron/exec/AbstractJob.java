package com.ck.quiz.cron.exec;

import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.LogPushService;
import com.ck.quiz.utils.SpringContextUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public abstract class AbstractJob {

    @Autowired
    protected JobLogger log;

    public abstract String getJobPreffix();

    public abstract String getJobLabel();

    public abstract Map<String, Object> getParamDef();

    public void fire(String jobId) {
        NamedParameterJdbcTemplate jt = SpringContextUtil.getBean(NamedParameterJdbcTemplate.class);
        Map<String, Object> queryParams = new HashMap<>();
        queryParams.put("id", jobId);
        
        // 添加重试逻辑：最多尝试5次，每次间隔500ms，确保事务已提交
        List<Map<String, Object>> list = null;
        int retryCount = 0;
        int maxRetries = 5;
        long retryDelayMs = 500;
        
        while (retryCount < maxRetries) {
            list = HumpHelper.lineToHump(jt.queryForList("select * from job where id=:id", queryParams));
            if (!list.isEmpty()) {
                break;
            }
            retryCount++;
            if (retryCount < maxRetries) {
                try {
                    Thread.sleep(retryDelayMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("任务查询被中断: " + jobId, e);
                }
            }
        }
        
        if (list.isEmpty()) {
            throw new RuntimeException("未查询到任务id为【" + jobId + "】的job任务，已重试" + maxRetries + "次");
        }
        Map<String, Object> job = list.get(0);
        Object startTimeObj = job.get("startTime");
        LocalDateTime startTime = startTimeObj instanceof java.sql.Timestamp 
                ? ((java.sql.Timestamp) startTimeObj).toLocalDateTime() 
                : (LocalDateTime) startTimeObj;
        String taskParamsStr = MapUtils.getString(job, "taskParams");
        Map<String, Object> taskParams = new HashMap<>();
        if (StringUtils.isNotBlank(taskParamsStr)) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                taskParams = mapper.readValue(taskParamsStr, new TypeReference<>() {
                });
            } catch (JsonProcessingException e) {
                throw new RuntimeException(e);
            }
        }
        Map<String, Object> updateParams = new HashMap<>();
        updateParams.put("jobId", jobId);
        try {
            String logName = getJobPreffix() + "-" + jobId;
            String logPath = Paths.get("logs", logName).toAbsolutePath() + ".log";
            taskParams.put("jobId", jobId);
            updateParams.put("logPath", logPath);
            jt.update("update job set log_path=:logPath where id=:jobId", updateParams);
            MDC.put("bizLogFile", logName);
            MDC.put("jobId", jobId);
            run(taskParams);
            MDC.remove("bizLogFile");
            MDC.remove("jobId");
            SpringContextUtil.getBean(LogPushService.class).complete(jobId);
            LocalDateTime endTime = LocalDateTime.now();
            updateParams.put("state", "SUCCESS");
            updateParams.put("endTime", endTime);
            updateParams.put("durationMs", endTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() - startTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            updateParams.put("logPath", logPath);
            jt.update("update job set state=:state, end_time=:endTime, duration_ms=:durationMs, log_path=:logPath where id=:jobId", updateParams);
        } catch (Exception e) {
            SpringContextUtil.getBean(LogPushService.class).complete(jobId);
            MDC.remove("bizLogFile");
            MDC.remove("jobId");
            log.error("任务【{}】执行失败：{}", jobId, ExceptionUtils.getStackTrace(e));
            LocalDateTime endTime = LocalDateTime.now();
            updateParams.put("state", "FAILED");
            updateParams.put("endTime", endTime);
            updateParams.put("durationMs", endTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() - startTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            // 将异常栈保存为纯文本，避免二进制序列化导致的编码错误
            updateParams.put("errorMessage", ExceptionUtils.getStackTrace(e));
            jt.update("update job set state=:state, end_time=:endTime, duration_ms=:durationMs, error_message=:errorMessage where id=:jobId", updateParams);
        } finally {
            SpringContextUtil.getBean(LogPushService.class).complete(jobId);
            MDC.remove("bizLogFile");
            MDC.remove("jobId");
        }
    }

    public abstract void run(Map<String, Object> params);

}
