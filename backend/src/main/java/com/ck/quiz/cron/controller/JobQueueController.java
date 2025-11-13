package com.ck.quiz.cron.controller;


import com.ck.quiz.cron.domain.JobQueue;
import com.ck.quiz.cron.service.JobQueueService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import org.apache.commons.collections4.MapUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;


@RestController
@RequestMapping("api/job/queue")
public class JobQueueController {

    @Autowired
    private JobQueueService jobQueueService;

    @GetMapping("/list")
    @Operation(summary = "获取队列数据")
    public ResponseEntity<Object> listQueues() {
        return ResponseEntity.ok(jobQueueService.listQueues());
    }

    @GetMapping("/search")
    @Operation(summary = "搜索队列数据")
    public ResponseEntity<Object> searchQueues(@Parameter(description = "每页数量") @RequestParam(required = false, defaultValue = "20") int limit,
                                 @Parameter(description = "偏移量") @RequestParam(required = false, defaultValue = "0") int offset,
                                 @Parameter(description = "关键词") @RequestParam(required = false, defaultValue = "") String keyWord) {
        return ResponseEntity.ok(jobQueueService.searchQueues(limit, offset, keyWord));
    }

    @PostMapping("/delete/{id}")
    @Operation(summary = "删除队列")
    public ResponseEntity<Object> deleteQueue(@Parameter(description = "队列ID") @PathVariable String id) {
        return ResponseEntity.ok(jobQueueService.deleteQueue(id));
    }

    @GetMapping("/check/uniq")
    @Operation(summary = "队列名唯一性检查")
    public ResponseEntity<Object> checkUniq(@Parameter(description = "队列ID") @RequestParam(required = false) String id,
                              @Parameter(description = "队列名称") @RequestParam String name) {
        return ResponseEntity.ok(jobQueueService.checkQueueNameUniq(id, name));
    }

    @PostMapping("/create")
    @Operation(summary = "新建队列")
    public ResponseEntity<Object> createQueue(@Parameter(description = "队列信息") @RequestBody JobQueue jobQueue) {
        return ResponseEntity.ok(jobQueueService.createQueue(jobQueue));
    }

    @PostMapping("/disable/{id}")
    @Operation(summary = "失效队列")
    public ResponseEntity<Object> disableQueue(@Parameter(description = "队列ID") @PathVariable String id) {
        return ResponseEntity.ok(jobQueueService.disableQueue(id));
    }

    @PostMapping("/enable/{id}")
    @Operation(summary = "生效队列")
    public ResponseEntity<Object> enableQueue(@Parameter(description = "队列ID") @PathVariable String id) {
        return ResponseEntity.ok(jobQueueService.enableQueue(id));
    }

    @PostMapping("/update/{id}/size")
    @Operation(summary = "修改队列大小")
    public ResponseEntity<Object> updateQueueSize(@Parameter(description = "队列ID") @PathVariable String id, @Parameter(description = "包含size的请求体") @RequestBody Map<String, Object> body) {
        int size = MapUtils.getIntValue(body, "size");
        return ResponseEntity.ok(jobQueueService.updateQueueSize(id, size));
    }

}
