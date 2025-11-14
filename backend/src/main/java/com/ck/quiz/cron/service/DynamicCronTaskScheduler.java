package com.ck.quiz.cron.service;


import com.ck.quiz.cron.dto.CronTaskDto;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.SpringContextUtil;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.DependsOn;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.scheduling.Trigger;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;
import org.springframework.scheduling.support.CronTrigger;
import org.springframework.stereotype.Component;

import java.lang.reflect.Method;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledFuture;


@Component
public class DynamicCronTaskScheduler {

    private static final Logger log = LoggerFactory.getLogger(DynamicCronTaskScheduler.class);

    public static ExecutorService executor = Executors.newCachedThreadPool();

    @Autowired
    private ScheduledTaskRegistrar taskRegistrar;

    @Autowired
    private NamedParameterJdbcTemplate jt;

    // 存储已注册的任务，用于取消
    private final Map<String, ScheduledFuture<?>> registeredTasks = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        Map<String, Object> params = new HashMap<>();
        HumpHelper.lineToHump(jt.queryForList("select * from cron_task where state = '1' and queue_name is null", params))
                .forEach(job -> {
                    registerTask(job);
                });
    }

    public void registerTask(Map<String, Object> task) {
        String state = MapUtils.getString(task, "state");
        String id = MapUtils.getString(task, "id");
        String name = MapUtils.getString(task, "name");
        String label = MapUtils.getString(task, "label");
        if (!("1".equals(state)) || registeredTasks.containsKey(id)) {
            return;
        }
        String cronExpression = MapUtils.getString(task, "cronExpression");
        if (StringUtils.isBlank(cronExpression)) {
            return;
        }
        Runnable taskRunner = createTaskRunner(task);
        Trigger trigger = new CronTrigger(cronExpression);
        log.info("注册定时任务: id={}, name={}, label={}, cronExpression={}", id, name, label, cronExpression);
        ScheduledFuture<?> future = taskRegistrar
                .getScheduler()
                .schedule(taskRunner, trigger);
        registeredTasks.put(id, future);
    }

    public void registerTask(CronTaskDto task) {
        String id = task.getId();
        String name = task.getName();
        String label = task.getLabel();
        if (!("1".equals(task.getState())) || registeredTasks.containsKey(id)) {
            return;
        }
        String cronExpression = task.getCronExpression();
        if (StringUtils.isBlank(cronExpression)) {
            return;
        }
        Runnable taskRunner = createTaskRunner(task);
        Trigger trigger = new CronTrigger(cronExpression);
        log.info("注册定时任务: id={}, name={}, label={}, cronExpression={}", id, name, label, cronExpression);
        ScheduledFuture<?> future = taskRegistrar
                .getScheduler()
                .schedule(taskRunner, trigger);
        registeredTasks.put(id, future);
    }

    public void cancelTask(String taskId) {
        Map<String, Object> params = new HashMap<>();
        params.put("id", taskId);
        List<Map<String, Object>> list = HumpHelper
                .lineToHump(jt.queryForList("select * from cron_task where id = :id", params));
        if (!list.isEmpty()) {
            Map<String, Object> task = list.get(0);
            String name = MapUtils.getString(task, "name");
            String label = MapUtils.getString(task, "label");
            String cronExpression = MapUtils.getString(task, "cronExpression");
            log.info("取消定时任务: id={}, name={}, label={}, cronExpression={}", taskId, name, label, cronExpression);
        } else {
            log.info("取消定时任务: id={}", taskId);
        }
        ScheduledFuture<?> future = registeredTasks.get(taskId);
        if (future != null) {
            future.cancel(true);
            registeredTasks.remove(taskId);
        }
    }

    public Runnable createTaskRunner(Map<String, Object> task) {
        return () -> {
            try {
                String jobId = addJob(task);
                String id = MapUtils.getString(task, "id");
                String taskClass = MapUtils.getString(task, "taskClass");
                String fireParams = MapUtils.getString(task, "fireParams");
                Map<String, Object> params = new HashMap<>();
                if (StringUtils.isNotBlank(fireParams)) {
                    ObjectMapper mapper = new ObjectMapper();
                    try {
                        Map<String, Object> tempParams = mapper.readValue(fireParams, new TypeReference<>() {});
                        if (tempParams != null) {
                            params.putAll(tempParams);
                        }
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException(e);
                    }
                }
                params.put("jobId", jobId);
                Class<?> clazz = Class.forName(taskClass);
                Object bean = SpringContextUtil.getBean(clazz);
                Method method = clazz.getMethod("fire", String.class, Map.class);
                method.invoke(bean, id, params);
            } catch (Exception e) {
                log.error("定时任务反射异常:{}", ExceptionUtils.getStackTrace(e));
            }
        };
    }

    private String addJob(Map<String, Object> task) {
        String jobId = IdHelper.genUuid();
        Map<String, Object> jobMap = new HashMap<>();
        jobMap.put("id", jobId);
        jobMap.put("task_id", MapUtils.getString(task, "id"));
        jobMap.put("trigger_type", "CRON");
        jobMap.put("state", "RUNNING");
        jobMap.put("start_time", new Date());
        jobMap.put("create_time", new Date());
        jobMap.put("task_params", MapUtils.getString(task, "fireParams"));
        jobMap.put("task_class", MapUtils.getString(task, "taskClass"));
        String insertSql = "INSERT INTO job (id, task_id, trigger_type, state, start_time, create_time, task_params, task_class) " +
                "VALUES (:id, :task_id, :trigger_type, :state, :start_time, :create_time, :task_params, :task_class)";
        SpringContextUtil.getBean(NamedParameterJdbcTemplate.class).update(insertSql, jobMap);
        return jobId;
    }

    public Runnable createTaskRunner(CronTaskDto task) {
        return () -> {
            try {
                String jobId = addJob(task);
                String fireParams = task.getFireParams();
                Map<String, Object> params = new HashMap<>();
                if (StringUtils.isNotBlank(fireParams)) {
                    ObjectMapper mapper = new ObjectMapper();
                    try {
                        Map<String, Object> tempParams = mapper.readValue(fireParams, new TypeReference<>() {});
                        if (tempParams != null) {
                            params.putAll(tempParams);
                        }
                    } catch (JsonProcessingException e) {
                        throw new RuntimeException(e);
                    }
                }
                params.put("jobId", jobId);
                Class<?> clazz = Class.forName(task.getTaskClass());
                Object bean = SpringContextUtil.getBean(clazz);
                Method method = clazz.getMethod("fire", String.class, Map.class);
                method.invoke(bean, task.getId(), params);
            } catch (Exception e) {
                log.error("定时任务反射异常:{}", ExceptionUtils.getStackTrace(e));
            }
        };
    }

    private String addJob(CronTaskDto task) {
        String jobId = IdHelper.genUuid();
        Map<String, Object> jobMap = new HashMap<>();
        jobMap.put("id", jobId);
        jobMap.put("task_id", task.getId());
        jobMap.put("trigger_type", "CRON");
        jobMap.put("state", "RUNNING");
        jobMap.put("start_time", new Date());
        jobMap.put("create_time", new Date());
        jobMap.put("task_params", task.getFireParams());
        jobMap.put("task_class", task.getTaskClass());
        String insertSql = "INSERT INTO job (id, task_id, trigger_type, state, start_time, create_time, task_params, task_class) " +
                "VALUES (:id, :task_id, :trigger_type, :state, :start_time, :create_time, :task_params, :task_class)";
        SpringContextUtil.getBean(NamedParameterJdbcTemplate.class).update(insertSql, jobMap);
        return jobId;
    }


}
