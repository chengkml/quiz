package com.ck.quiz.cron.exec;

import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.SpringContextUtil;
import org.apache.commons.collections.MapUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.support.CronExpression;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


public abstract class AbstractCronTask {

    private static final Logger log = LoggerFactory.getLogger(AbstractCronTask.class);

    protected int checkFire(String id) {
        NamedParameterJdbcTemplate jt = SpringContextUtil.getBean(NamedParameterJdbcTemplate.class);
        Map<String, Object> params = new HashMap<>();
        params.put("id", id);
        List<Map<String, Object>> list = HumpHelper
                .lineToHump(jt.queryForList("select * from cron_task where id=:id", params));
        if (list.isEmpty()) {
            log.info("未查询到任务id为{}的cron任务", id);
            return 0;
        }
        Map<String, Object> map = list.get(0);
        String cron = (String) map.get("cronExpression");
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextTime = CronExpression.parse(cron).next(now);
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String nextFireTime = nextTime.format(formatter);
        int updateNum = SpringContextUtil.getBean(JdbcTemplate.class).update(
                "update cron_task set next_fire_time=? where ((next_fire_time is null or next_fire_time<>?) or queue_name is not null) and id=? ",
                new Object[]{nextFireTime, nextFireTime, id});
        return updateNum;
    }

    public void fire(String id, Map<String, Object> params) {
        if (checkFire(id) == 1) {
            NamedParameterJdbcTemplate jt = SpringContextUtil.getBean(NamedParameterJdbcTemplate.class);
            Map<String, Object> queryParams = new HashMap<>();
            queryParams.put("id", id);
            List<Map<String, Object>> list = HumpHelper
                    .lineToHump(jt.queryForList("select * from cron_task where id=:id", queryParams));
            if (list.isEmpty()) {
                log.info("未查询到任务id为{}的cron任务", id);
                return;
            }
            Map<String, Object> runParams = list.get(0);
            runParams.putAll(params);
            Map<String, Object> updateParams = new HashMap<>();
            String jobId = MapUtils.getString(params, "jobId");
            updateParams.put("jobId", jobId);
            List<Map<String, Object>> jobList = HumpHelper.lineToHump(jt.queryForList("select * from job where id = :jobId", updateParams));
            if (jobList.isEmpty()) {
                return;
            }
            Date startTime = (Date) jobList.get(0).get("startTime");
            try {
                String logPath = run(runParams);
                Date endTime = new Date();
                updateParams.put("state", "SUCCESS");
                updateParams.put("endTime", endTime);
                updateParams.put("durationMs", endTime.getTime() - startTime.getTime());
                updateParams.put("logPath", logPath);
                jt.update("update job set state=:state, end_time=:endTime, duration_ms=:durationMs, log_path=:logPath where id=:jobId", updateParams);
            } catch (Exception e) {
                log.error("任务【{}】执行失败：{}", jobId, e);
                Date endTime = new Date();
                updateParams.put("state", "FAILED");
                updateParams.put("endTime", endTime);
                updateParams.put("durationMs", endTime.getTime() - startTime.getTime());
                jt.update("update job set state=:state, end_time=:endTime, duration_ms=:durationMs where id=:jobId", updateParams);
            }
        }
    }

    public abstract String run(Map<String, Object> params);

}
