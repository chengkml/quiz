package com.ck.quiz.cron.exec;

import com.ck.quiz.cron.service.DynamicCronTaskScheduler;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.SpringContextUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.scheduling.support.CronExpression;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 队列扫描定时器
 */
@Slf4j
@Component
public class QueueCronTask {

    @Autowired
    private NamedParameterJdbcTemplate jt;

    @Scheduled(cron = "*/10 * * * * ?")
    public void runTask() {
        try{
            checkJobToPush(jt);
            checkJobToPop(jt);
        }catch (Exception e){
            log.error("定时任务执行失败：{}", ExceptionUtils.getStackTrace(e));
        }
    }

    private void checkJobToPush(NamedParameterJdbcTemplate jt) {
        try {
            Map<String, Object> params = new HashMap<>();
            List<Map<String, Object>> list = HumpHelper.lineToHump(jt.queryForList("select * from cron_task where state = '1' and queue_name is not null ", params));
            list.forEach(map -> {
                String id = MapUtils.getString(map, "id");
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                String dbNextFireTime = MapUtils.getString(map, "nextFireTime");
                if (dbNextFireTime == null) {
                    dbNextFireTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:sss"));
                }
                LocalDateTime dbNextFireLDate = LocalDateTime.parse(dbNextFireTime, formatter);
                Date dbNextFireDate = Date.from(dbNextFireLDate.atZone(ZoneId.systemDefault()).toInstant());
                String cron = MapUtils.getString(map, "cronExpression");
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime nextTime = CronExpression.parse(cron).next(now);
                String nextFireTime = nextTime.format(formatter);
                Date nextFireDate = Date.from(nextTime.atZone(ZoneId.systemDefault()).toInstant());
                Date nowTime = new Date();
                if (nowTime.getTime() > dbNextFireDate.getTime() && nextFireDate.getTime() > nowTime.getTime()) {
                    params.put("nextFireTime", nextFireTime);
                    params.put("id", id);
                    int updateNum = jt.update(
                            "update cron_task set next_fire_time=:nextFireTime where (next_fire_time is null or next_fire_time<>:nextFireTime) and id=:id ", params);
                    if (updateNum == 1) {
                        Map<String, Object> pjob = new HashMap<>();
                        pjob.put("id", IdHelper.genUuid());
                        pjob.put("taskId", MapUtils.getString(map, "id"));
                        pjob.put("taskClass", MapUtils.getString(map, "taskClass"));
                        pjob.put("taskParams", MapUtils.getString(map, "fireParams"));
                        pjob.put("triggerType", "QUEUE_CRON");
                        pjob.put("priority", 0); // 这里可根据需要从 CronTask 定义扩展字段
                        pjob.put("queueName", MapUtils.getString(map, "queueName"));
                        pjob.put("pushTime", new Date());

                        jt.update("insert into synth_pending_job " +
                                        "(id, task_id, task_class, task_params, trigger_type, priority, queue_name, push_time) " +
                                        "values (:id, :taskId, :taskClass, :taskParams, :triggerType, :priority, :queueName, :pushTime)",
                                pjob);
                        // 入pending的任务，也入一份到synth_pending_job；
                        Map<String, Object> jobParams = new HashMap<>();
                        jobParams.put("id", pjob.get("id"));
                        jobParams.put("taskId", pjob.get("taskId"));
                        jobParams.put("taskClass", pjob.get("taskClass"));
                        jobParams.put("taskParams", pjob.get("taskParams"));
                        jobParams.put("queueName", pjob.get("queueName"));
                        jobParams.put("triggerType", pjob.get("triggerType"));
                        jobParams.put("state", "PENDING");
                        jobParams.put("createTime", new Date());
                        jt.update("insert into synth_job " +
                                        "(id, task_id, task_class, task_params, queue_name, trigger_type, state, create_time) " +
                                        "values (:id, :taskId, :taskClass, :taskParams, :queueName, :triggerType, :state, :createTime)",
                                jobParams);
                        log.info("任务 [{}] 已推入队列 [{}]，下一次执行时间：{}",
                                pjob.get("taskId"), pjob.get("queueName"), nextFireTime);
                    }
                }

            });
        } catch (Exception e) {
            log.error("检查待入队任务异常:{}", ExceptionUtils.getStackTrace(e));
        }
    }

    private void checkJobToPop(NamedParameterJdbcTemplate jt) {
        try {
            // 查询所有可用队列
            Map<String, Object> params = new HashMap<>();
            List<Map<String, Object>> queues = HumpHelper.lineToHump(
                    jt.queryForList("select * from synth_job_queue where state='1'", params));

            for (Map<String, Object> queue : queues) {
                String queueName = MapUtils.getString(queue, "queueName");
                int queueSize = MapUtils.getInteger(queue, "queueSize", 0);

                // 查询运行中的任务数
                Map<String, Object> cntParams = new HashMap<>();
                cntParams.put("queueName", queueName);
                int runningCnt = jt.queryForObject(
                        "select count(1) from synth_job where state='RUNNING' and queue_name=:queueName",
                        cntParams, Integer.class);

                if (runningCnt >= queueSize) {
                    log.info("队列 [{}] 已满，运行中 {}，容量 {}", queueName, runningCnt, queueSize);
                    continue;
                }

                int canPull = queueSize - runningCnt;

                // 查询待出队任务
                Map<String, Object> jobParams = new HashMap<>();
                jobParams.put("queueName", queueName);
                jobParams.put("limit", canPull);
                List<Map<String, Object>> pendingJobs = HumpHelper.lineToHump(
                        jt.queryForList(
                                "select * from synth_pending_job where queue_name=:queueName " +
                                        "order by priority desc, push_time asc limit :limit",
                                jobParams));
                String popBatchNo = IdHelper.genUuid();
                jobParams.put("popBatchNo", popBatchNo);
                List<String> pendingIds = new ArrayList<>();
                pendingJobs.forEach(pj -> {
                    pendingIds.add(MapUtils.getString(pj, "id"));
                });
                jobParams.put("pendingIds", pendingIds);
                if (!pendingIds.isEmpty()) {
                    int updateNum = jt.update("update synth_pending_job set pop_batch_no = :popBatchNo where id in (:pendingIds) ", jobParams);
                    if (updateNum > 0) {
                        pendingJobs = HumpHelper.lineToHump(jt.queryForList("select * from synth_pending_job where pop_batch_no = :popBatchNo ", jobParams));
                        for (Map<String, Object> job : pendingJobs) {
                            String jobId = MapUtils.getString(job, "id");
                            String taskClass = MapUtils.getString(job, "taskClass");
                            try {

                                // 写出队日志表
                                Map<String, Object> logParams = new HashMap<>();
                                logParams.put("id", jobId);
                                logParams.put("taskId", MapUtils.getString(job, "taskId"));
                                logParams.put("taskClass", MapUtils.getString(job, "taskClass"));
                                logParams.put("taskParams", MapUtils.getString(job, "taskParams"));
                                logParams.put("triggerType", MapUtils.getString(job, "triggerType"));
                                logParams.put("priority", MapUtils.getInteger(job, "priority", 0));
                                logParams.put("queueName", queueName);
                                logParams.put("popTime", new Date());
                                jt.update("insert into synth_pending_job_log " +
                                                "(id, task_id, task_class, task_params, trigger_type, priority, queue_name, pop_time) " +
                                                "values (:id, :taskId, :taskClass, :taskParams, :triggerType, :priority, :queueName, :popTime)",
                                        logParams);

                                // 更新任务表
                                Map<String, Object> runningParams = new HashMap<>();
                                runningParams.put("id", jobId);
                                runningParams.put("state", "RUNNING");
                                runningParams.put("startTime", new Date());
                                jt.update("update synth_job " +
                                                "set state = :state, start_time = :startTime " +
                                                "where id = :id",
                                        runningParams);
                                // 删除 pending_job 记录
                                jt.update("delete from synth_pending_job where id=:id", new HashMap<String, Object>() {{
                                    put("id", jobId);
                                }});
                                log.info("任务 [{}] 出队 -> 已写入运行表，队列 [{}]", jobId, queueName);
                                DynamicCronTaskScheduler.executor.execute(createTaskRunner(MapUtils.getString(job, "taskId"), jobId, taskClass, MapUtils.getString(job, "taskParams")));
                            } catch (Exception e) {
                                log.error("任务【{}】出队失败:{}", jobId, ExceptionUtils.getStackTrace(e));
                            }
                        }
                    }
                }

            }
        } catch (Exception e) {
            log.error("检查待出队任务异常:{}", ExceptionUtils.getStackTrace(e));
        }
    }

    public Runnable createTaskRunner(String taskId, String jobId, String taskClass, String taskParamsStr) {
        return () -> {
            try {
                Class<?> clazz = Class.forName(taskClass);
                Object bean = SpringContextUtil.getBean(clazz);
                if (bean instanceof AbstractAsyncJob) {
                    Method method = clazz.getMethod("fire", String.class);
                    method.invoke(bean, jobId);
                } else if (bean instanceof AbstractJob) {
                    Method method = clazz.getMethod("fire", String.class);
                    method.invoke(bean, jobId);
                } else if (bean instanceof AbstractCronTask) {
                    Method method = clazz.getMethod("fire", String.class, Map.class);
                    Map<String, Object> taskParams = new HashMap<>();
                    taskParams.put("jobId", jobId);

                    if (StringUtils.isNotBlank(taskParamsStr)) {
                        ObjectMapper mapper = new ObjectMapper();
                        try {
                            taskParams.putAll(mapper.readValue(taskParamsStr, new TypeReference<>() {}));
                        } catch (JsonProcessingException e) {
                            throw new RuntimeException(e);
                        }
                    }
                    method.invoke(bean, taskId, taskParams);
                }else {
                    throw new RuntimeException("无法识别Job实现："+taskClass);
                }
            } catch (Exception e) {
                log.error("定时任务反射异常:{}", ExceptionUtils.getStackTrace(e));
            }
        };
    }


}
