package com.ck.quiz.script.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.script.dto.ScriptInfoCreateDto;
import com.ck.quiz.script.dto.ScriptInfoDto;
import com.ck.quiz.script.dto.ScriptInfoQueryDto;
import com.ck.quiz.script.dto.ScriptInfoUpdateDto;
import com.ck.quiz.script.service.ScriptInfoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "脚本管理", description = "脚本相关的API接口")
@RestController
@RequestMapping("/api/script/info")
public class ScriptInfoController extends BaseController<ScriptInfoCreateDto, ScriptInfoUpdateDto, ScriptInfoQueryDto, ScriptInfoDto> {

    @Autowired
    private ScriptInfoService scriptInfoService;

    @Operation(summary = "根据脚本编码查询", description = "根据脚本编码获取脚本信息")
    @GetMapping("/code/{code}")
    public ResponseEntity<ScriptInfoDto> getScriptInfoByCode(
            @Parameter(description = "脚本编码", required = true) @PathVariable("code") String code) {
        ScriptInfoDto dto = scriptInfoService.getScriptInfoByCode(code);
        return ResponseEntity.ok(dto);
    }

    @Operation(summary = "执行脚本", description = "执行指定的脚本")
    @PostMapping("/{id}/exec")
    public ResponseEntity<Void> execScript(
            @Parameter(description = "脚本ID", required = true) @PathVariable("id") String id,
            @Parameter(description = "队列ID", required = true) @RequestParam("queueId") String queueId) {
        scriptInfoService.execScript(id, queueId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "查询脚本执行任务", description = "分页查询脚本执行任务列表")
    @GetMapping("/jobs")
    public ResponseEntity<Page<Map<String, Object>>> searchJobs(
            @Parameter(description = "偏移量") @RequestParam(value = "offset", defaultValue = "0") int offset,
            @Parameter(description = "限制数") @RequestParam(value = "limit", defaultValue = "20") int limit,
            @Parameter(description = "脚本ID") @RequestParam(value = "scriptId") String scriptId,
            @Parameter(description = "状态") @RequestParam(value = "state", required = false) String state,
            @Parameter(description = "任务类") @RequestParam(value = "taskClass", required = false) String taskClass,
            @Parameter(description = "队列名") @RequestParam(value = "queueName", required = false) String queueName,
            @Parameter(description = "触发类型") @RequestParam(value = "triggerType", required = false) String triggerType,
            @Parameter(description = "开始时间上限") @RequestParam(value = "startTimeLt", required = false) String startTimeLt,
            @Parameter(description = "开始时间下限") @RequestParam(value = "startTimeGt", required = false) String startTimeGt,
            @Parameter(description = "任务ID") @RequestParam(value = "taskId", required = false) String taskId,
            @Parameter(description = "关键字") @RequestParam(value = "keyWord", required = false) String keyWord) {
        Page<Map<String, Object>> pageInfo = scriptInfoService.searchJobs(
                offset, limit, scriptId, state, taskClass, queueName,
                triggerType, startTimeLt, startTimeGt, taskId, keyWord);
        return ResponseEntity.ok(pageInfo);
    }

    @Operation(summary = "删除作业", description = "根据作业ID删除脚本执行任务")
    @PostMapping("/delete/job/{jobId}")
    public ResponseEntity<String> deleteJob(
            @Parameter(description = "作业ID", required = true) @PathVariable("jobId") String jobId) {
        scriptInfoService.deleteJob(jobId);
        return ResponseEntity.ok("删除成功");
    }

    @Override
    protected BaseService<ScriptInfoCreateDto, ScriptInfoUpdateDto, ScriptInfoQueryDto, ScriptInfoDto, ?> getService() {
        return scriptInfoService;
    }
}