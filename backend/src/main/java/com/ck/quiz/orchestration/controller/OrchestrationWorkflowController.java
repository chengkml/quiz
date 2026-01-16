package com.ck.quiz.orchestration.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.orchestration.dto.*;
import com.ck.quiz.orchestration.service.OrchestrationWorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "编排工作流管理", description = "编排工作流的创建、更新、发布与版本管理接口")
@RestController
@RequestMapping("/api/orchestration/workflow")
public class OrchestrationWorkflowController extends BaseController<OrchestrationWorkflowCreateDto, OrchestrationWorkflowUpdateDto, OrchestrationWorkflowQueryDto, OrchestrationWorkflowDto> {

    @Autowired
    private OrchestrationWorkflowService workflowService;

    @Override
    protected BaseService<OrchestrationWorkflowCreateDto, OrchestrationWorkflowUpdateDto, OrchestrationWorkflowQueryDto, OrchestrationWorkflowDto, ?> getService() {
        return workflowService;
    }

    @Operation(summary = "发布工作流", description = "将指定版本发布为当前工作流版本")
    @PostMapping("/{workflowId}/publish/{versionId}")
    public ResponseEntity<OrchestrationWorkflowDto> publish(
            @Parameter(description = "工作流ID", required = true) @PathVariable String workflowId,
            @Parameter(description = "版本ID", required = true) @PathVariable String versionId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.publish(userId, workflowId, versionId));
    }

    @Operation(summary = "创建工作流版本", description = "基于当前工作流定义创建新版本")
    @PostMapping("/{workflowId}/versions")
    public ResponseEntity<OrchestrationWorkflowVersionDto> createVersion(
            @Parameter(description = "工作流ID", required = true) @PathVariable String workflowId,
            @Valid @RequestBody OrchestrationWorkflowVersionCreateDto createDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        createDto.setWorkflowId(workflowId);
        return ResponseEntity.ok(workflowService.createVersion(userId, createDto));
    }

    @Operation(summary = "更新工作流版本", description = "更新指定工作流版本的定义")
    @PutMapping("/versions/{versionId}")
    public ResponseEntity<OrchestrationWorkflowVersionDto> updateVersion(
            @Parameter(description = "版本ID", required = true) @PathVariable String versionId,
            @Valid @RequestBody OrchestrationWorkflowVersionUpdateDto updateDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        updateDto.setId(versionId);
        return ResponseEntity.ok(workflowService.updateVersion(userId, updateDto));
    }

    @Operation(summary = "查询工作流版本列表", description = "根据工作流ID查询版本列表")
    @GetMapping("/{workflowId}/versions")
    public ResponseEntity<List<OrchestrationWorkflowVersionDto>> listVersions(
            @Parameter(description = "工作流ID", required = true) @PathVariable String workflowId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.listVersions(userId, workflowId));
    }

    @Operation(summary = "获取工作流最新版本", description = "根据工作流ID获取最新版本定义")
    @GetMapping("/{workflowId}/versions/latest")
    public ResponseEntity<OrchestrationWorkflowVersionDto> getLatestVersion(
            @Parameter(description = "工作流ID", required = true) @PathVariable String workflowId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.getLatestVersion(userId, workflowId));
    }
}

