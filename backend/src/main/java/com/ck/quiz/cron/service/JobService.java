package com.ck.quiz.cron.service;

import com.ck.quiz.cron.domain.Job;
import com.ck.quiz.cron.domain.PendingJob;
import com.ck.quiz.cron.dto.JobDto;
import com.ck.quiz.cron.exec.AbstractAsyncJob;
import com.ck.quiz.cron.exec.AbstractJob;
import com.ck.quiz.cron.repository.JobRepository;
import com.ck.quiz.cron.repository.PendingJobRepository;
import com.ck.quiz.seq.service.SeqService;
import com.ck.quiz.utils.HumpHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.ck.quiz.utils.SpringContextUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.collections4.MapUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.exception.ExceptionUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;

import java.io.*;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.lang.reflect.Modifier;
import java.nio.file.Paths;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class JobService {

    @Autowired
    private PendingJobRepository pendingJobRepo;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private PendingJobRepository pendingJobRepository;

    @Autowired
    private SeqService seqService;

    @Autowired
    private NamedParameterJdbcTemplate jt;

    /**
     * 分页查询作业
     */
    public Page<Map<String, Object>> searchJobs(int offset, int limit, String state, String taskClass, String queueName, String triggerType, String startTimeLt, String startTimeGt, String taskId, String keyWord) {
        Map<String, Object> params = new HashMap<>();

        StringBuilder listSql = new StringBuilder("select j.*,q.queue_label from synth_job j left join synth_job_queue q on j.queue_name = q.queue_name where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(*) from synth_job j where 1=1 ");

        // 状态过滤
        JdbcQueryHelper.equals("state", state, "and j.state = :state ", params, listSql, countSql);

        JdbcQueryHelper.equals("taskClass", taskClass, "and j.task_class = :taskClass ", params, listSql, countSql);

        JdbcQueryHelper.equals("queueName", queueName, "and j.queue_name = :queueName ", params, listSql, countSql);

        JdbcQueryHelper.equals("triggerType", triggerType, "and j.trigger_type = :triggerType ", params, listSql, countSql);

        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
        if (StringUtils.isNotBlank(startTimeLt) && StringUtils.isNotBlank(startTimeGt)) {
            try {
                JdbcQueryHelper.datetimeBetween("j.start_time", "startTimeGt", sdf.parse(startTimeGt), "startTimeLt", sdf.parse(startTimeLt), params, jt, listSql, countSql);
            } catch (ParseException e) {
                log.error("日期转换异常：{}", ExceptionUtils.getStackTrace(e));
            }
        }

        // 任务ID过滤
        JdbcQueryHelper.equals("taskId", taskId, "and j.task_id = :taskId ", params, listSql, countSql);

        // 关键字搜索
        JdbcQueryHelper.lowerLike("keyWord", keyWord, "and lower(j.id) like :keyWord ", params, jt, listSql, countSql);

        // 排序
        listSql.append(" order by j.create_time desc ");

        // 分页
        int pageSize = limit;
        int pageNum = offset / pageSize;
        String limitSql = JdbcQueryHelper.getLimitSql(jt, listSql.toString(), pageNum, pageSize);

        // 查询数据
        List<Map<String, Object>> rows = HumpHelper.lineToHump(jt.queryForList(limitSql, params));
        if (!rows.isEmpty()) {
            Map<String, String> jobLabelMap = getJobLabelMap();
            rows.forEach(row -> {
                String jobLabel = jobLabelMap.get(MapUtils.getString(row, "taskClass"));
                row.put("jobLabel", jobLabel);
            });
        }

        return JdbcQueryHelper.toPage(jt, countSql.toString(), params, rows, pageNum, pageSize);
    }

    /**
     * 获取作业统计信息
     */
    public Map<String, Object> getStatistics() {
        Map<String, Object> statistics = new HashMap<>();


        // 总作业数
        long totalJobs = jobRepository.count();
        statistics.put("totalJobs", totalJobs);

        // 今日作业数
        // 使用当天0点到次日0点的时间范围统计
        Calendar cal = Calendar.getInstance();
        cal.set(Calendar.HOUR_OF_DAY, 0);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);
        Date startOfDay = cal.getTime();
        cal.add(Calendar.DAY_OF_MONTH, 1);
        Date startOfNextDay = cal.getTime();

        // 时间格式统一（如需日志或调试）
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

        Map<String, Object> params = new HashMap<>();
        // 采用通用辅助方法生成跨库兼容的时间范围 SQL（内部适配 MySQL/PG）
        StringBuilder countSql = new StringBuilder("select count(*) from synth_job where 1=1 ");
        JdbcQueryHelper.datetimeBetween(
                "create_time",
                "startTimeGt", startOfDay,
                "startTimeLt", startOfNextDay,
                params, jt, countSql, countSql
        );
        Long todayJobs = jt.queryForObject(countSql.toString(), params, Long.class);
        statistics.put("todayJobs", todayJobs != null ? todayJobs : 0L);

        // 运行中作业数
        Long runningJobs = jobRepository.countRunningJobs();
        statistics.put("runningJobs", runningJobs != null ? runningJobs : 0L);

        // 失败作业数
        Long failedJobs = jobRepository.countFailedJobs();
        statistics.put("failedJobs", failedJobs != null ? failedJobs : 0L);

        // 成功作业数
        Long successJobs = jobRepository.countSuccessJobs();
        statistics.put("successJobs", successJobs != null ? successJobs : 0L);

        // 各状态统计
        List<Object[]> stateStats = jobRepository.countByState();
        Map<String, Long> stateMap = new HashMap<>();
        for (Object[] stat : stateStats) {
            stateMap.put((String) stat[0], (Long) stat[1]);
        }
        statistics.put("stateStatistics", stateMap);

        // 排队作业数
        long pendingJobs = pendingJobRepository.count();
        statistics.put("pendingJobs", pendingJobs);

        return statistics;
    }

    /**
     * 分页查询排队作业
     */
    public Page<Map<String, Object>> searchQueueJobs(int offset, int limit, String queueName, String taskId, String keyWord) {
        Map<String, Object> params = new HashMap<>();

        StringBuilder listSql = new StringBuilder("select * from synth_pending_job where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(*) from synth_pending_job where 1=1 ");

        // 队列名过滤
        JdbcQueryHelper.equals("queueName", queueName, "and queue_name = :queueName ", params, listSql, countSql);

        // 任务ID过滤
        JdbcQueryHelper.equals("taskId", taskId, "and task_id = :taskId ", params, listSql, countSql);

        // 关键字搜索
        JdbcQueryHelper.lowerLike("keyWord", keyWord, "and (lower(task_id) like :keyWord or lower(queue_name) like :keyWord) ", params, jt, listSql, countSql);

        // 排序
        listSql.append(" order by priority desc, push_time asc ");

        // 分页
        int pageSize = limit;
        int pageNum = offset / pageSize;
        String limitSql = JdbcQueryHelper.getLimitSql(jt, listSql.toString(), pageNum, pageSize);

        // 查询数据
        List<Map<String, Object>> rows = HumpHelper.lineToHump(jt.queryForList(limitSql, params));

        return JdbcQueryHelper.toPage(jt, countSql.toString(), params, rows, pageNum, pageSize);
    }

    /**
     * 停止作业
     */
    @Transactional
    public String stopJob(String jobId) {
        Optional<Job> optional = jobRepository.findById(jobId);
        if (!optional.isPresent()) {
            throw new RuntimeException("作业不存在");
        }

        Job job = optional.get();
        if (!"RUNNING".equals(job.getState())) {
            throw new RuntimeException("只能停止运行中的作业");
        }

        Optional<PendingJob> pOptional = pendingJobRepo.findById(jobId);
        if (pOptional.isPresent()) {
            pendingJobRepo.delete(pOptional.get());
        }

        // 更新作业状态为已停止
        job.setState("STOPPED");
        job.setEndTime(LocalDateTime.now());
        if (job.getStartTime() != null) {
            job.setDurationMs(job.getEndTime().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli() - job.getStartTime().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli());
        }
        jobRepository.save(job);

        return jobId;
    }

    /**
     * 重试作业
     */
    @Transactional
    public String retryJob(String jobId) {
        Optional<Job> optional = jobRepository.findById(jobId);
        if (!optional.isPresent()) {
            throw new RuntimeException("作业不存在");
        }

        Job job = optional.get();
        if (!"FAILED".equals(job.getState()) && !"STOPPED".equals(job.getState())) {
            throw new RuntimeException("只能重试失败或已停止的作业");
        }

        // 重置作业状态
        job.setState("PENDING");
        job.setStartTime(null);
        job.setEndTime(null);
        job.setDurationMs(null);
        job.setErrorMessage(null);
        jobRepository.save(job);


        return jobId;
    }

    @Transactional
    public String addJob(JobDto jobDto) throws ClassNotFoundException, NoSuchMethodException, InvocationTargetException, IllegalAccessException {
        Class<?> clazz = Class.forName(jobDto.getTaskClass());
        Object bean = SpringContextUtil.getBean(clazz);
        Method method = clazz.getMethod("getJobPreffix");
        String preffix = (String) method.invoke(bean);
        // 生成 jobId
        String jobId = seqService.genDaylySeq(preffix);

        // 保存到 synth_job
        Job job = new Job();
        job.setId(jobId);
        job.setTaskClass(jobDto.getTaskClass());
        job.setTaskParams(jobDto.getTaskParams());
        job.setQueueName(jobDto.getQueueName());
        job.setTriggerType("HAND");
        job.setState("PENDING"); // 初始状态
        job.setCreateTime(LocalDateTime.now());
        jobRepository.save(job);

        // 保存到 synth_pending_job
        PendingJob pendingJob = new PendingJob();
        pendingJob.setId(jobId); // 和 job 共用同一个 id
        pendingJob.setTaskClass(jobDto.getTaskClass());
        pendingJob.setTaskParams(jobDto.getTaskParams());
        pendingJob.setTriggerType("HAND");
        pendingJob.setPriority(jobDto.getPriority());
        pendingJob.setQueueName(jobDto.getQueueName());
        pendingJob.setPushTime(LocalDateTime.now());
        pendingJobRepository.save(pendingJob);

        return jobId;
    }

    public List<Map<String, String>> getJobOptions() {
        return Arrays.stream(new Class[]{})
                .filter(clazz -> AbstractJob.class.isAssignableFrom(clazz) || AbstractAsyncJob.class.isAssignableFrom(clazz)) // 必须继承 AbstractJob
                .filter(clazz -> !Modifier.isAbstract(clazz.getModifiers())) // 排除抽象类
                .map(clazz -> {
                    try {
                        Object instance = clazz.getDeclaredConstructor().newInstance();
                        if (instance instanceof AbstractAsyncJob) {
                            AbstractAsyncJob job = (AbstractAsyncJob) instance;
                            Map<String, String> option = new HashMap<>();
                            option.put("label", job.getJobLabel());
                            option.put("value", clazz.getName());
                            return option;
                        }
                        AbstractJob job = (AbstractJob) instance;
                        Map<String, String> option = new HashMap<>();
                        option.put("label", job.getJobLabel());
                        option.put("value", clazz.getName());
                        return option;
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to instantiate job class: " + clazz.getName(), e);
                    }
                })
                .collect(Collectors.toList());
    }

    public Map<String, String> getJobLabelMap() {
        return Arrays.stream(new Class[]{})
                .filter(clazz -> AbstractJob.class.isAssignableFrom(clazz) || AbstractAsyncJob.class.isAssignableFrom(clazz))
                .filter(clazz -> !Modifier.isAbstract(clazz.getModifiers()))
                .map(clazz -> {
                    try {
                        Object instance = clazz.getDeclaredConstructor().newInstance();
                        if (instance instanceof AbstractAsyncJob) {
                            AbstractAsyncJob job = (AbstractAsyncJob) instance;
                            return new AbstractMap.SimpleEntry<>(clazz.getName(), job.getJobLabel());
                        }
                        AbstractJob job = (AbstractJob) instance;
                        return new AbstractMap.SimpleEntry<>(clazz.getName(), job.getJobLabel());
                    } catch (Exception e) {
                        throw new RuntimeException("Failed to instantiate job class: " + clazz.getName(), e);
                    }
                })
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
    }


    public List<String> getLogs(String jobId, int limit, int offset) {
        Map<String, Object> params = new HashMap<>();
        params.put("taskId", jobId);

        StringBuilder sql = new StringBuilder("SELECT * FROM synth_py_log WHERE 1=1 ");
        JdbcQueryHelper.equals("taskId", jobId, "AND task_id = :taskId ", params, sql);

        sql.append("ORDER BY sort_time ASC ");

        String limitSql = JdbcQueryHelper.getLimitSql(jt, sql.toString(), offset / limit, limit);

        List<Map<String, Object>> rows = HumpHelper.lineToHump(jt.queryForList(limitSql, params));
        List<String> result = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String msg = MapUtils.getString(row, "msg");
            String createTime = MapUtils.getString(row, "createTime");
            createTime = createTime.substring(0, 19);
            msg = "[" + createTime + "]" + msg;
            result.add(msg);
        }
        return result;
    }

    public String exportLogsToFile(String jobId) {
        Map<String, Object> params = new HashMap<>();
        params.put("taskId", jobId);

        StringBuilder sql = new StringBuilder("SELECT msg FROM synth_py_log WHERE 1=1 ");
        JdbcQueryHelper.equals("taskId", jobId, "AND task_id = :taskId ", params, sql);
        sql.append("ORDER BY sort_time ASC ");

        String logPath = Paths.get("logs", jobId).toAbsolutePath() + ".txt";
        File outFile = new File(logPath);
        ensureFileAndParentExists(outFile);


        int batchSize = 1000;
        int offset = 0;

        try (BufferedWriter writer = new BufferedWriter(new FileWriter(outFile))) {
            while (true) {
                String limitSql = JdbcQueryHelper.getLimitSql(jt, sql.toString(), offset / batchSize, batchSize);
                List<Map<String, Object>> rows = jt.queryForList(limitSql, params);
                if (rows.isEmpty()) break;

                for (Map<String, Object> row : rows) {
                    String msg = row.get("msg") == null ? "" : row.get("msg").toString().replaceAll("\r\n|\r|\n", " ");
                    writer.write(msg);
                    writer.newLine(); // 每条日志换行
                }

                writer.flush(); // 每批次 flush
                offset += batchSize;
            }
        } catch (Exception e) {
            log.error("导出日志失败 jobId={}：{}", jobId, ExceptionUtils.getStackTrace(e));
            return null;
        }

        return outFile.getAbsolutePath();
    }


    public void exportLogs(String jobId, HttpServletResponse response) {
        String tempFilePath = exportLogsToFile(jobId);
        if (tempFilePath == null) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return;
        }

        File file = new File(tempFilePath);
        if (!file.exists()) {
            response.setStatus(HttpServletResponse.SC_NOT_FOUND);
            return;
        }

        response.setContentType("text/plain;charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"" + file.getName() + "\"");
        response.setContentLengthLong(file.length());

        try (InputStream in = new BufferedInputStream(new FileInputStream(file));
             OutputStream out = response.getOutputStream()) {
            FileCopyUtils.copy(in, out);
            out.flush();
        } catch (IOException e) {
            log.error("下载日志文件失败 jobId={}：{}", jobId, ExceptionUtils.getStackTrace(e));
        } finally {
            file.delete();
        }
    }

    private static void ensureFileAndParentExists(File file) {
        File parent = file.getParentFile();
        if (parent != null && !parent.exists()) {
            if (!parent.mkdirs()) {
                throw new RuntimeException("创建目录失败: " + parent.getAbsolutePath());
            }
        }
        try {
            if (!file.exists() && !file.createNewFile()) {
                throw new RuntimeException("创建文件失败: " + file.getAbsolutePath());
            }
        } catch (IOException e) {
            throw new RuntimeException("创建文件失败: " + file.getAbsolutePath(), e);
        }
    }

    @Transactional
    public String deleteJob(String jobId) {
        Optional<Job> optional = jobRepository.findById(jobId);
        if (!optional.isPresent()) {
            throw new RuntimeException("作业不存在");
        }

        Job job = optional.get();

        // 如果是排队中的作业，先从 pendingJob 删除
        Optional<PendingJob> pOptional = pendingJobRepo.findById(jobId);
        if (pOptional.isPresent()) {
            pendingJobRepo.delete(pOptional.get());
            log.info("已从排队队列删除作业: {}", jobId);
        }

        // 删除主表作业
        jobRepository.delete(job);
        log.info("已删除作业: {}", jobId);

        // （可选）删除作业日志，如果你不希望保留日志的话
        Map<String, Object> params = new HashMap<>();
        params.put("taskId", jobId);
        jt.update("DELETE FROM synth_py_log WHERE task_id = :taskId", params);
        jt.update("DELETE FROM synth_py_status_log WHERE task_id = :taskId", params);
        log.info("已删除作业日志: {}", jobId);

        return jobId;
    }

}