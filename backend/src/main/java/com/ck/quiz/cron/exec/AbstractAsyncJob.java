package com.ck.quiz.cron.exec;

import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.SpringContextUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.MDC;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;

import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
public abstract class AbstractAsyncJob {

    public abstract String getJobPreffix();

    public abstract String getJobLabel();

    public void fire(String jobId) {
        NamedParameterJdbcTemplate jt = SpringContextUtil.getBean(NamedParameterJdbcTemplate.class);

        Map<String, Object> queryParams = new HashMap<>();
        queryParams.put("id", jobId);

        List<Map<String, Object>> list = HumpHelper
                .lineToHump(jt.queryForList("select * from job where id=:id", queryParams));

        if (list.isEmpty()) {
            throw new RuntimeException("未查询到任务id为【" + jobId + "】的job任务");
        }

        Map<String, Object> job = list.get(0);
        LocalDateTime startTime = (LocalDateTime) job.get("startTime");

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
            // -----------------------------
            // 设置日志输出独立文件
            // -----------------------------
            String logName = getJobPreffix() + "-" + jobId;
            MDC.put("bizLogFile", logName);
            String logPath = Paths.get("logs", logName).toAbsolutePath() + ".log";

            taskParams.put("jobId", jobId);

            // -----------------------------
            // 执行业务逻辑（异步任务核心）
            // -----------------------------
            run(taskParams);

            // -----------------------------
            // 执行成功，更新记录
            // -----------------------------
            LocalDateTime endTime = LocalDateTime.now();
            updateParams.put("state", "SUCCESS");
            updateParams.put("endTime", endTime);
            updateParams.put("durationMs", endTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() - startTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            updateParams.put("logPath", logPath);

            jt.update(
                    "update job set state=:state, end_time=:endTime, duration_ms=:durationMs, log_path=:logPath " +
                            "where id=:jobId",
                    updateParams
            );

        } catch (Exception e) {

            log.error("任务【{}】执行失败：{}", jobId, ExceptionUtils.getStackTrace(e));

            LocalDateTime endTime = LocalDateTime.now();
            updateParams.put("state", "FAILED");
            updateParams.put("endTime", endTime);
            updateParams.put("durationMs", endTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() - startTime.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
            updateParams.put("errorMessage", ExceptionUtils.getStackTrace(e));

            jt.update(
                    "update job set state=:state, end_time=:endTime, duration_ms=:durationMs, error_message=:errorMessage " +
                            "where id=:jobId",
                    updateParams
            );

        } finally {
            // 必须清理 MDC，否则线程复用时会串日志
            MDC.remove("bizLogFile");
        }
    }

    public abstract void run(Map<String, Object> params);

}
