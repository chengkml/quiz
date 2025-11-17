package com.ck.quiz.script.controller;

import com.ck.quiz.script.dto.ScriptInfoCreateDto;
import com.ck.quiz.script.dto.ScriptInfoDto;
import com.ck.quiz.script.dto.ScriptInfoQueryDto;
import com.ck.quiz.script.dto.ScriptInfoUpdateDto;
import com.ck.quiz.script.service.ScriptInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 脚本信息Controller
 */
@RestController
@RequestMapping("/api/script/info")
@RequiredArgsConstructor
public class ScriptInfoController {

    private final ScriptInfoService scriptInfoService;

    /**
     * 创建脚本信息
     */
    @PostMapping
    public ResponseEntity<Map<String, String>> createScriptInfo(@Validated @RequestBody ScriptInfoCreateDto createDto) {
        String id = scriptInfoService.createScriptInfo(createDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", id));
    }

    /**
     * 根据ID查询脚本信息
     */
    @GetMapping("/{id}")
    public ResponseEntity<ScriptInfoDto> getScriptInfoById(@PathVariable("id") String id) {
        ScriptInfoDto dto = scriptInfoService.getScriptInfoById(id);
        return ResponseEntity.ok(dto);
    }

    /**
     * 根据脚本编码查询脚本信息
     */
    @GetMapping("/code/{code}")
    public ResponseEntity<ScriptInfoDto> getScriptInfoByCode(@PathVariable("code") String code) {
        ScriptInfoDto dto = scriptInfoService.getScriptInfoByCode(code);
        return ResponseEntity.ok(dto);
    }

    /**
     * 查询脚本信息列表
     */
    @GetMapping
    public ResponseEntity<Page<ScriptInfoDto>> queryScriptInfo(ScriptInfoQueryDto queryDto) {
        Page<ScriptInfoDto> pageInfo = scriptInfoService.queryScriptInfo(queryDto);
        return ResponseEntity.ok(pageInfo);
    }

    /**
     * 更新脚本信息
     */
    @PutMapping
    public ResponseEntity<Void> updateScriptInfo(@Validated @RequestBody ScriptInfoUpdateDto updateDto) {
        scriptInfoService.updateScriptInfo(updateDto);
        return ResponseEntity.ok().build();
    }

    /**
     * 删除脚本信息
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteScriptInfo(@PathVariable("id") String id) {
        scriptInfoService.deleteScriptInfo(id);
        return ResponseEntity.ok().build();
    }

    /**
     * 批量删除脚本信息
     */
    @DeleteMapping("/batch")
    public ResponseEntity<Void> batchDeleteScriptInfo(@RequestBody List<String> ids) {
        scriptInfoService.batchDeleteScriptInfo(ids);
        return ResponseEntity.ok().build();
    }

    /**
     * 启用脚本
     */
    @PutMapping("/{id}/enable")
    public ResponseEntity<Void> enableScript(@PathVariable("id") String id) {
        scriptInfoService.updateScriptState(id, "ENABLED");
        return ResponseEntity.ok().build();
    }

    /**
     * 禁用脚本
     */
    @PutMapping("/{id}/disable")
    public ResponseEntity<Void> disableScript(@PathVariable("id") String id) {
        scriptInfoService.updateScriptState(id, "DISABLED");
        return ResponseEntity.ok().build();
    }

    /**
     * 执行脚本
     */
    @PostMapping("/{id}/exec")
    public ResponseEntity<Void> execScript(
            @PathVariable("id") String id,
            @RequestParam("queueId") String queueId) {

        scriptInfoService.execScript(id, queueId);
        return ResponseEntity.ok().build();
    }

    /**
     * 查询脚本执行任务列表
     */
    @GetMapping("/jobs")
    public ResponseEntity<Page<Map<String, Object>>> searchJobs(
            @RequestParam(value = "offset", defaultValue = "0") int offset,
            @RequestParam(value = "limit", defaultValue = "20") int limit,
            @RequestParam(value = "scriptId") String scriptId,
            @RequestParam(value = "state", required = false) String state,
            @RequestParam(value = "taskClass", required = false) String taskClass,
            @RequestParam(value = "queueName", required = false) String queueName,
            @RequestParam(value = "triggerType", required = false) String triggerType,
            @RequestParam(value = "startTimeLt", required = false) String startTimeLt,
            @RequestParam(value = "startTimeGt", required = false) String startTimeGt,
            @RequestParam(value = "taskId", required = false) String taskId,
            @RequestParam(value = "keyWord", required = false) String keyWord
    ) {

        Page<Map<String, Object>> pageInfo = scriptInfoService.searchJobs(
                offset, limit, scriptId, state, taskClass, queueName,
                triggerType, startTimeLt, startTimeGt, taskId, keyWord
        );

        return ResponseEntity.ok(pageInfo);
    }

}