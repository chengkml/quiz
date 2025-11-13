package com.ck.quiz.cron.controller;


import com.ck.quiz.cron.dto.CronTaskDto;
import com.ck.quiz.cron.service.CronTaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


@RestController
@RequestMapping("_api/_/synth/cron/task")
public class CronTaskController {

    @Autowired
    private CronTaskService cronTaskService;

    @GetMapping("/getCronTaskList")
    @Operation(summary = "获取列表数据")
    public ResponseEntity<Object> getCronTaskList(@Parameter(description = "每页数量") @RequestParam(required = false, defaultValue = "20") int limit,
                                  @Parameter(description = "偏移量") @RequestParam(required = false, defaultValue = "0") int offset,
                                  @Parameter(description = "队列名称") @RequestParam(required = false, defaultValue = "") String queueName,
                                  @Parameter(description = "状态") @RequestParam(required = false, defaultValue = "") String state,
                                  @Parameter(description = "关键词") @RequestParam(required = false, defaultValue = "") String keyWord) {
        return ResponseEntity.ok(cronTaskService.getCronTaskList(offset, limit, queueName, state, keyWord));
    }

    @PostMapping("/delete")
    @Operation(summary = "删除")
    public ResponseEntity<Object> cronTaskDelete(@Parameter(description = "任务ID列表") @RequestBody List<String> ids) {
        return ResponseEntity.ok(cronTaskService.cronTaskDelete(ids));
    }

    @PostMapping("/save")
    @Operation(summary = "保存")
    public ResponseEntity<Object> cronTaskSave(@Parameter(description = "定时任务信息") @RequestBody CronTaskDto cronTaskDto) {
        return ResponseEntity.ok(cronTaskService.saveCronJob(cronTaskDto));
    }

    @PostMapping("/trigger/{id}")
    @Operation(summary = "触发")
    public ResponseEntity<Object> triggerById(@Parameter(description = "任务ID") @PathVariable String id) {
        return ResponseEntity.ok(cronTaskService.triggerById(id));
    }

}
