package com.ck.quiz.cron.controller;

import com.ck.quiz.cron.dto.JobDto;
import com.ck.quiz.cron.service.JobService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.lang.reflect.InvocationTargetException;

@RestController
@RequestMapping("api/cron/job")
public class CronJobController {

    @Autowired
    private JobService jobService;

    /**
     * 搜索作业
     */
    @GetMapping("/search")
    @Operation(summary = "搜索作业")
    public ResponseEntity<Object> searchJobs(@Parameter(description = "每页数量") @RequestParam(required = false, defaultValue = "20") int limit,
                                             @Parameter(description = "偏移量") @RequestParam(required = false, defaultValue = "0") int offset,
                                             @Parameter(description = "状态") @RequestParam(required = false, defaultValue = "") String state,
                                             @Parameter(description = "任务类名") @RequestParam(required = false, defaultValue = "") String taskClass,
                                             @Parameter(description = "队列名称") @RequestParam(required = false, defaultValue = "") String queueName,
                                             @Parameter(description = "触发类型") @RequestParam(required = false, defaultValue = "") String triggerType,
                                             @Parameter(description = "开始时间小于") @RequestParam(required = false, defaultValue = "") String startTimeLt,
                                             @Parameter(description = "开始时间大于") @RequestParam(required = false, defaultValue = "") String startTimeGt,
                                             @Parameter(description = "任务ID") @RequestParam(required = false, defaultValue = "") String taskId,
                                             @Parameter(description = "关键词") @RequestParam(required = false, defaultValue = "") String keyWord) {
        return ResponseEntity.ok(jobService.searchJobs(offset, limit, state, taskClass, queueName, triggerType, startTimeLt, startTimeGt, taskId, keyWord));
    }

    /**
     * 获取作业统计信息
     */
    @GetMapping("/statistics")
    @Operation(summary = "获取作业统计信息")
    public ResponseEntity<Object> getStatistics() {
        return ResponseEntity.ok(jobService.getStatistics());
    }

    /**
     * 搜索排队作业
     */
    @GetMapping("/queue/search")
    @Operation(summary = "搜索排队作业")
    public ResponseEntity<Object> searchQueueJobs(@Parameter(description = "每页数量") @RequestParam(required = false, defaultValue = "20") int limit,
                                                  @Parameter(description = "偏移量") @RequestParam(required = false, defaultValue = "0") int offset,
                                                  @Parameter(description = "队列名称") @RequestParam(required = false, defaultValue = "") String queueName,
                                                  @Parameter(description = "任务ID") @RequestParam(required = false, defaultValue = "") String taskId,
                                                  @Parameter(description = "关键词") @RequestParam(required = false, defaultValue = "") String keyWord) {
        return ResponseEntity.ok(jobService.searchQueueJobs(offset, limit, queueName, taskId, keyWord));
    }

    /**
     * 停止作业
     */
    @PostMapping("/stop/{jobId}")
    @Operation(summary = "停止作业")
    public ResponseEntity<Object> stopJob(@Parameter(description = "作业ID") @PathVariable String jobId) {
        return ResponseEntity.ok(jobService.stopJob(jobId));
    }

    /**
     * 重试作业
     */
    @PostMapping("/retry/{jobId}")
    @Operation(summary = "重试作业")
    public ResponseEntity<Object> retryJob(@Parameter(description = "作业ID") @PathVariable String jobId) {
        return ResponseEntity.ok(jobService.retryJob(jobId));
    }

    @PostMapping("/add/job")
    @Operation(summary = "新增作业")
    public ResponseEntity<Object> addJob(@Parameter(description = "作业信息") @RequestBody JobDto jobDto) throws ClassNotFoundException, InvocationTargetException, NoSuchMethodException, IllegalAccessException {
        return ResponseEntity.ok(jobService.addJob(jobDto));
    }

    @PostMapping("/delete/job/{jobId}")
    @Operation(summary = "删除作业")
    public ResponseEntity<Object> deleteJob(@Parameter(description = "作业ID") @PathVariable String jobId) {
        jobService.deleteJob(jobId);
        return ResponseEntity.ok("删除成功");
    }

    @GetMapping("/options")
    @Operation(summary = "获取作业类型选项")
    public ResponseEntity<Object> getJobOptions() {
        return ResponseEntity.ok(jobService.getJobOptions());
    }

    @GetMapping("/logs/{jobId}")
    @Operation(summary = "获取作业日志")
    public ResponseEntity<Object> getLogs(@Parameter(description = "作业ID") @PathVariable String jobId,
                                          @Parameter(description = "每页数量") @RequestParam(required = false, defaultValue = "20") int limit,
                                          @Parameter(description = "偏移量") @RequestParam(required = false, defaultValue = "0") int offset
    ) {
        return ResponseEntity.ok(jobService.getLogs(jobId, limit, offset));
    }

    @PostMapping("/download/logs/{jobId}")
    @Operation(summary = "导出作业日志")
    public void exportExcel(
            @Parameter(description = "作业ID") @PathVariable String jobId,
            HttpServletResponse response) {
        jobService.exportLogs(jobId, response);
    }

    @GetMapping(path = "/logs/stream/{jobId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "实时获取作业日志（SSE）")
    public SseEmitter streamLogs(@PathVariable String jobId) {
        return jobService.streamLogs(jobId);
    }

}
