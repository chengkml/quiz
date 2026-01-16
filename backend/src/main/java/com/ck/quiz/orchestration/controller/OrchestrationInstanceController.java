package com.ck.quiz.orchestration.controller;

import com.ck.quiz.orchestration.dto.OrchestrationInstanceDto;
import com.ck.quiz.orchestration.dto.OrchestrationInstanceQueryDto;
import com.ck.quiz.orchestration.dto.OrchestrationStartRequest;
import com.ck.quiz.orchestration.service.OrchestrationWorkflowService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "编排工作流执行", description = "编排工作流实例的启动与查询接口")
@RestController
@RequestMapping("/api/orchestration")
public class OrchestrationInstanceController {

    @Autowired
    private OrchestrationWorkflowService workflowService;

    @Operation(summary = "启动工作流实例", description = "根据工作流ID启动一个新的执行实例")
    @PostMapping("/workflow/{workflowId}/start")
    public ResponseEntity<OrchestrationInstanceDto> startWorkflow(
            @Parameter(description = "工作流ID", required = true) @PathVariable String workflowId,
            @Valid @RequestBody OrchestrationStartRequest startRequest) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.start(userId, workflowId, startRequest));
    }

    @Operation(summary = "查询工作流实例", description = "分页查询工作流执行实例")
    @PostMapping("/instances/search")
    public ResponseEntity<Page<OrchestrationInstanceDto>> searchInstances(
            @Valid @RequestBody OrchestrationInstanceQueryDto queryDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String userId = authentication != null ? authentication.getName() : null;
        return ResponseEntity.ok(workflowService.searchInstances(userId, queryDto));
    }
}

