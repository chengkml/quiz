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
 * <p>
 * 功能：
 * 1. 定时扫描数据库中的cron任务，将符合条件的任务推入队列（pending_job）。
 * 2. 从队列中出队任务，标记为运行中，并通过DynamicCronTaskScheduler异步执行。
 */
@Slf4j
@Component
public class QueueCronTask {

    @Autowired
    private NamedParameterJdbcTemplate jt;

    /**
     * 定时任务入口
     * 每10秒执行一次，分别调用检查任务入队和出队逻辑
     */
    @Scheduled(cron = "*/10 * * * * ?")
    public void runTask() {
        try {
            checkJobToPush(jt);
            checkJobToPop(jt);
        } catch (Exception e) {
            log.error("定时任务执行失败：{}", ExceptionUtils.getStackTrace(e));
        }
    }

    /**
     * 检查需要入队的任务
     * <p>
     * 查询cron_task表中state=1且queue_name不为空的任务：
     * 1. 比较数据库记录的nextFireTime与当前时间，判断是否需要入队。
     * 2. 计算下一次执行时间，并更新cron_task.next_fire_time。
     * 3. 将任务插入到pending_job和job表中（pending状态）。
     *
     * @param jt NamedParameterJdbcTemplate
     */
    private void checkJobToPush(NamedParameterJdbcTemplate jt) {
        try {
            Map<String, Object> params = new HashMap<>();
            List<Map<String, Object>> list = HumpHelper.lineToHump(
                    jt.queryForList("select * from cron_task where state = 'ENABLED' and queue_name is not null ", params));

            list.forEach(map -> {
                String id = MapUtils.getString(map, "id");
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
                String dbNextFireTime = MapUtils.getString(map, "nextFireTime");

                // 如果数据库中nextFireTime为空，则使用当前时间
                if (dbNextFireTime == null) {
                    dbNextFireTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:sss"));
                }

                LocalDateTime dbNextFireLDate = LocalDateTime.parse(dbNextFireTime, formatter);
                Date dbNextFireDate = Date.from(dbNextFireLDate.atZone(ZoneId.systemDefault()).toInstant());

                // 解析cron表达式，计算下一次触发时间
                String cron = MapUtils.getString(map, "cronExpression");
                LocalDateTime now = LocalDateTime.now();
                LocalDateTime nextTime = CronExpression.parse(cron).next(now);
                String nextFireTime = nextTime.format(formatter);
                Date nextFireDate = Date.from(nextTime.atZone(ZoneId.systemDefault()).toInstant());
                Date nowTime = new Date();

                // 判断是否入队：当前时间 > 数据库记录的nextFireTime && 下一次触发时间 > 当前时间
                if (nowTime.getTime() > dbNextFireDate.getTime() && nextFireDate.getTime() > nowTime.getTime()) {
                    params.put("nextFireTime", nextFireTime);
                    params.put("id", id);

                    // 更新下一次触发时间
                    int updateNum = jt.update(
                            "update cron_task set next_fire_time=:nextFireTime where (next_fire_time is null or next_fire_time<>:nextFireTime) and id=:id ",
                            params);

                    if (updateNum == 1) {
                        // 生成pending任务
                        Map<String, Object> pjob = new HashMap<>();
                        pjob.put("id", IdHelper.genUuid());
                        pjob.put("taskId", MapUtils.getString(map, "id"));
                        pjob.put("taskClass", MapUtils.getString(map, "taskClass"));
                        pjob.put("taskParams", MapUtils.getString(map, "fireParams"));
                        pjob.put("triggerType", "QUEUE_CRON");
                        pjob.put("priority", 0);
                        pjob.put("queueName", MapUtils.getString(map, "queueName"));
                        pjob.put("pushTime", new Date());

                        // 插入pending_job表
                        jt.update("insert into pending_job " +
                                        "(id, task_id, task_class, task_params, trigger_type, priority, queue_name, push_time) " +
                                        "values (:id, :taskId, :taskClass, :taskParams, :triggerType, :priority, :queueName, :pushTime)",
                                pjob);

                        // 同时插入job表（任务状态PENDING）
                        Map<String, Object> jobParams = new HashMap<>();
                        jobParams.put("id", pjob.get("id"));
                        jobParams.put("taskId", pjob.get("taskId"));
                        jobParams.put("taskClass", pjob.get("taskClass"));
                        jobParams.put("taskParams", pjob.get("taskParams"));
                        jobParams.put("queueName", pjob.get("queueName"));
                        jobParams.put("triggerType", pjob.get("triggerType"));
                        jobParams.put("state", "PENDING");
                        jobParams.put("createTime", new Date());

                        jt.update("insert into job " +
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

    /**
     * 检查需要出队的任务
     * <p>
     * 1. 查询job_queue表中所有可用队列。
     * 2. 计算每个队列可出队的任务数量（队列容量 - 正在运行任务数）。
     * 3. 查询pending_job表获取待出队任务，并按优先级和入队时间排序。
     * 4. 为出队任务生成popBatchNo，并更新pending_job表。
     * 5. 写出队日志（pending_job_log）、更新job表为RUNNING状态、删除pending_job表记录。
     * 6. 异步执行任务。
     *
     * @param jt NamedParameterJdbcTemplate
     */
    private void checkJobToPop(NamedParameterJdbcTemplate jt) {
        try {
            Map<String, Object> params = new HashMap<>();
            List<Map<String, Object>> queues = HumpHelper.lineToHump(
                    jt.queryForList("select * from job_queue where state='ENABLED'", params));

            for (Map<String, Object> queue : queues) {
                String queueName = MapUtils.getString(queue, "queueName");
                int queueSize = MapUtils.getInteger(queue, "queueSize", 0);

                // 查询正在运行的任务数量
                Map<String, Object> cntParams = new HashMap<>();
                cntParams.put("queueName", queueName);
                int runningCnt = jt.queryForObject(
                        "select count(1) from job where state='RUNNING' and queue_name=:queueName",
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
                                "select * from pending_job where queue_name=:queueName " +
                                        "order by priority desc, push_time asc limit :limit",
                                jobParams));

                String popBatchNo = IdHelper.genUuid();
                jobParams.put("popBatchNo", popBatchNo);
                List<String> pendingIds = new ArrayList<>();
                pendingJobs.forEach(pj -> pendingIds.add(MapUtils.getString(pj, "id")));
                jobParams.put("pendingIds", pendingIds);

                if (!pendingIds.isEmpty()) {
                    // 更新pending_job表，标记popBatchNo
                    int updateNum = jt.update("update pending_job set pop_batch_no = :popBatchNo where id in (:pendingIds) ", jobParams);

                    if (updateNum > 0) {
                        pendingJobs = HumpHelper.lineToHump(jt.queryForList(
                                "select * from pending_job where pop_batch_no = :popBatchNo ", jobParams));

                        for (Map<String, Object> job : pendingJobs) {
                            String jobId = MapUtils.getString(job, "id");
                            String taskClass = MapUtils.getString(job, "taskClass");
                            try {
                                // 写出队日志
                                Map<String, Object> logParams = new HashMap<>();
                                logParams.put("id", jobId);
                                logParams.put("taskId", MapUtils.getString(job, "taskId"));
                                logParams.put("taskClass", taskClass);
                                logParams.put("taskParams", MapUtils.getString(job, "taskParams"));
                                logParams.put("triggerType", MapUtils.getString(job, "triggerType"));
                                logParams.put("priority", MapUtils.getInteger(job, "priority", 0));
                                logParams.put("queueName", queueName);
                                logParams.put("popTime", new Date());
                                jt.update("insert into pending_job_log " +
                                                "(id, task_id, task_class, task_params, trigger_type, priority, queue_name, pop_time) " +
                                                "values (:id, :taskId, :taskClass, :taskParams, :triggerType, :priority, :queueName, :popTime)",
                                        logParams);

                                // 更新任务表为RUNNING
                                Map<String, Object> runningParams = new HashMap<>();
                                runningParams.put("id", jobId);
                                runningParams.put("state", "RUNNING");
                                runningParams.put("startTime", new Date());
                                jt.update("update job set state = :state, start_time = :startTime where id = :id", runningParams);

                                // 删除pending_job记录
                                jt.update("delete from pending_job where id=:id", new HashMap<String, Object>() {{
                                    put("id", jobId);
                                }});

                                log.info("任务 [{}] 出队 -> 已写入运行表，队列 [{}]", jobId, queueName);

                                // 异步执行任务
                                DynamicCronTaskScheduler.executor.execute(
                                        createTaskRunner(MapUtils.getString(job, "taskId"), jobId, taskClass, MapUtils.getString(job, "taskParams"))
                                );

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

    /**
     * 创建任务执行Runner
     * <p>
     * 根据taskClass反射调用任务的fire方法：
     * 1. AbstractAsyncJob / AbstractJob -> fire(String jobId)
     * 2. AbstractCronTask -> fire(String taskId, Map<String, Object> params)
     *
     * @param taskId        Cron任务ID
     * @param jobId         job表ID
     * @param taskClass     任务实现类全名
     * @param taskParamsStr JSON格式的任务参数
     * @return Runnable 可提交到线程池执行
     */
    public Runnable createTaskRunner(String taskId, String jobId, String taskClass, String taskParamsStr) {
        return () -> {
            try {
                Class<?> clazz = Class.forName(taskClass);
                Object bean = SpringContextUtil.getBean(clazz);

                if (bean instanceof AbstractAsyncJob || bean instanceof AbstractJob) {
                    Method method = clazz.getMethod("fire", String.class);
                    method.invoke(bean, jobId);
                } else if (bean instanceof AbstractCronTask) {
                    Method method = clazz.getMethod("fire", String.class, Map.class);
                    Map<String, Object> taskParams = new HashMap<>();
                    taskParams.put("jobId", jobId);

                    if (StringUtils.isNotBlank(taskParamsStr)) {
                        ObjectMapper mapper = new ObjectMapper();
                        try {
                            taskParams.putAll(mapper.readValue(taskParamsStr, new TypeReference<>() {
                            }));
                        } catch (JsonProcessingException e) {
                            throw new RuntimeException(e);
                        }
                    }
                    method.invoke(bean, taskId, taskParams);
                } else {
                    throw new RuntimeException("无法识别Job实现：" + taskClass);
                }
            } catch (Exception e) {
                log.error("定时任务反射异常:{}", ExceptionUtils.getStackTrace(e));
            }
        };
    }

}
