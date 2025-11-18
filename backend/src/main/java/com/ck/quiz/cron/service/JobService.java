package com.ck.quiz.cron.service;

import com.ck.quiz.cron.domain.Job;
import com.ck.quiz.cron.domain.PendingJob;
import com.ck.quiz.cron.dto.JobDto;
import com.ck.quiz.cron.exec.AbstractAsyncJob;
import com.ck.quiz.cron.exec.AbstractJob;
import com.ck.quiz.cron.exec.LocalScriptExecJob;
import com.ck.quiz.cron.exec.RemoteScriptExecJob;
import com.ck.quiz.cron.repository.JobRepository;
import com.ck.quiz.cron.repository.PendingJobRepository;
import com.ck.quiz.seq.service.SeqService;
import com.ck.quiz.thpool.CommonPool;
import com.ck.quiz.utils.*;
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
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

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

    @Autowired
    private SseEmitterManager sseEmitterManager;

    @Autowired
    private LogPushService logPushService;

    /**
     * 分页查询作业
     */
    public Page<Map<String, Object>> searchJobs(int offset, int limit, String state, String taskClass, String queueName, String triggerType, String startTimeLt, String startTimeGt, String taskId, String keyWord) {
        Map<String, Object> params = new HashMap<>();

        StringBuilder listSql = new StringBuilder("select j.*,q.queue_label from job j left join job_queue q on j.queue_name = q.queue_name where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(*) from job j where 1=1 ");

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
        StringBuilder countSql = new StringBuilder("select count(*) from job where 1=1 ");
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

        StringBuilder listSql = new StringBuilder("select * from pending_job where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(*) from pending_job where 1=1 ");

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

        // 保存到 job
        Job job = new Job();
        job.setId(jobId);
        job.setTaskClass(jobDto.getTaskClass());
        job.setTaskParams(jobDto.getTaskParams());
        job.setQueueName(jobDto.getQueueName());
        job.setTriggerType("HAND");
        job.setState("PENDING"); // 初始状态
        job.setCreateTime(LocalDateTime.now());
        jobRepository.save(job);

        // 保存到 pending_job
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
        return Arrays.stream(new Class[]{LocalScriptExecJob.class, RemoteScriptExecJob.class})
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


    /**
     * 获取作业日志
     *
     * @param jobId  作业ID
     * @param limit  每页条数
     * @param offset 偏移量（从0开始）
     * @return 日志列表
     */
    public List<String> getLogs(String jobId, int limit, int offset) {
        if (StringUtils.isBlank(jobId)) {
            throw new IllegalArgumentException("jobId 不能为空");
        }
        if (limit <= 0) limit = 100;
        if (offset < 0) offset = 0;

        // 根据 jobId 查询 Job 实体，获取 logPath
        Optional<Job> optionalJob = jobRepository.findById(jobId);
        if (!optionalJob.isPresent()) {
            log.warn("作业不存在 jobId={}", jobId);
            return Collections.emptyList();
        }

        Job job = optionalJob.get();
        String logPath = job.getLogPath();
        if (StringUtils.isBlank(logPath)) {
            log.warn("作业未配置日志路径 jobId={}", jobId);
            return Collections.emptyList();
        }

        File logFile = new File(logPath);
        if (!logFile.exists() || !logFile.isFile()) {
            log.warn("日志文件不存在 jobId={}, path={}", jobId, logPath);
            return Collections.emptyList();
        }

        List<String> result = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(new FileReader(logFile))) {
            // 跳过 offset 行
            for (int i = 0; i < offset; i++) {
                if (reader.readLine() == null) {
                    // 文件行数不足 offset，直接返回空列表
                    return Collections.emptyList();
                }
            }
            // 读取 limit 行
            for (int i = 0; i < limit; i++) {
                String line = reader.readLine();
                if (line == null) break;
                result.add(line);
            }
        } catch (IOException e) {
            log.error("读取作业日志失败 jobId={}, path={}: {}", jobId, logPath, ExceptionUtils.getStackTrace(e));
        }

        return result;
    }


    /**
     * 导出作业日志到临时文件
     *
     * @param jobId 作业ID
     * @return 临时文件路径，如果失败返回 null
     */
    public String exportLogsToFile(String jobId) {
        if (StringUtils.isBlank(jobId)) {
            log.warn("jobId 为空，无法导出日志");
            return null;
        }

        Optional<Job> optionalJob = jobRepository.findById(jobId);
        if (!optionalJob.isPresent()) {
            log.warn("作业不存在 jobId={}", jobId);
            return null;
        }

        Job job = optionalJob.get();
        String logPath = job.getLogPath();
        if (StringUtils.isBlank(logPath)) {
            log.warn("作业未配置日志路径 jobId={}", jobId);
            return null;
        }

        File logFile = new File(logPath);
        if (!logFile.exists() || !logFile.isFile()) {
            log.warn("日志文件不存在 jobId={}, path={}", jobId, logPath);
            return null;
        }

        // 创建临时文件
        File tempFile;
        try {
            tempFile = File.createTempFile("job-log-" + jobId + "-", ".log");
            tempFile.deleteOnExit();
        } catch (IOException e) {
            log.error("创建临时文件失败 jobId={}：{}", jobId, ExceptionUtils.getStackTrace(e));
            return null;
        }

        // 拷贝日志内容到临时文件
        try (InputStream in = new FileInputStream(logFile);
             OutputStream out = new FileOutputStream(tempFile)) {
            FileCopyUtils.copy(in, out);
        } catch (IOException e) {
            log.error("写入临时日志文件失败 jobId={}：{}", jobId, ExceptionUtils.getStackTrace(e));
            return null;
        }

        return tempFile.getAbsolutePath();
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

        return jobId;
    }

    public SseEmitter streamLogs(@PathVariable String jobId) {
        Optional<Job> optional = jobRepository.findById(jobId);
        if (!optional.isPresent()) {
            throw new RuntimeException("作业不存在");
        }
        Job job = optional.get();

        // 1. 创建 SSE 连接
        SseEmitter emitter = sseEmitterManager.create(jobId);

        String logPath = job.getLogPath();
        if (StringUtils.isNotBlank(logPath)) {
            File logFile = new File(logPath);
            if (logFile.exists() && logFile.isFile()) {
                // 异步线程读取日志并推送
                CommonPool.cachedPool.execute(() -> {
                    try (RandomAccessFile raf = new RandomAccessFile(logFile, "r")) {
                        long pointer = 0;
                        long fileLength = raf.length();
                        if (fileLength < pointer) {
                            // 文件被截断或重新生成，重置指针
                            pointer = 0;
                        }
                        if (fileLength > pointer) {
                            raf.seek(pointer);
                            String line;
                            while ((line = raf.readLine()) != null) {
                                // 处理编码
                                line = new String(line.getBytes("ISO-8859-1"), "UTF-8");
                                logPushService.appendLog(jobId, line);
                            }
                        }
                    } catch (Exception e) {
                        log.error("实时推送日志异常 jobId={}：{}", jobId, ExceptionUtils.getStackTrace(e));
                    }finally {
                        if(Arrays.asList("SUCCESS", "FAILED").contains(job.getState())) {
                            logPushService.complete(jobId);
                        }
                    }

                });
            } else {
                log.warn("日志文件不存在 jobId={}, path={}", jobId, logPath);
            }
        }

        // 2. 返回给前端
        return emitter;
    }


}