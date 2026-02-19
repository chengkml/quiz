package com.ck.quiz.agent.controller;

import com.ck.quiz.agent.dto.*;
import com.ck.quiz.agent.service.AgentService;
import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "智能体管理", description = "智能体管理相关API")
@RestController
@RequestMapping("/api/agent")
public class AgentController
        extends BaseController<AgentCreateDto, AgentUpdateDto, AgentQueryDto, AgentDto> {

    private final AgentService agentService;

    public AgentController(AgentService agentService) {
        this.agentService = agentService;
    }

    @Override
    protected BaseService<AgentCreateDto, AgentUpdateDto, AgentQueryDto, AgentDto, ?> getService() {
        return agentService;
    }

    @Operation(summary = "启用智能体", description = "启用指定的智能体")
    @PostMapping("/{id}/enable")
    public ResponseEntity<AgentDto> enable(
            @Parameter(description = "智能体ID", required = true) @PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(agentService.enable(authentication.getName(), id));
    }

    @Operation(summary = "禁用智能体", description = "禁用指定的智能体")
    @PostMapping("/{id}/disable")
    public ResponseEntity<AgentDto> disable(
            @Parameter(description = "智能体ID", required = true) @PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(agentService.disable(authentication.getName(), id));
    }

    @Operation(summary = "复制智能体", description = "复制指定的智能体及其配置")
    @PostMapping("/{id}/duplicate")
    public ResponseEntity<AgentDto> duplicate(
            @Parameter(description = "智能体ID", required = true) @PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(agentService.duplicate(authentication.getName(), id));
    }

    @Operation(summary = "获取智能体工具列表", description = "获取智能体关联的MCP工具列表")
    @GetMapping("/{agentId}/tools")
    public ResponseEntity<List<AgentToolDto>> getTools(
            @Parameter(description = "智能体ID", required = true) @PathVariable String agentId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(agentService.getTools(authentication.getName(), agentId));
    }

    @Operation(summary = "更新智能体工具", description = "批量更新智能体关联的MCP工具")
    @PutMapping("/{agentId}/tools")
    public ResponseEntity<List<AgentToolDto>> updateTools(
            @Parameter(description = "智能体ID", required = true) @PathVariable String agentId,
            @Parameter(description = "工具批量更新信息", required = true) @RequestBody @Valid AgentToolBatchDto batchDto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(agentService.updateTools(authentication.getName(), agentId, batchDto));
    }

    @Operation(summary = "获取已启用的智能体列表", description = "获取所有已启用状态的智能体列表")
    @GetMapping("/list-enabled")
    public ResponseEntity<List<AgentDto>> listEnabled() {
        return ResponseEntity.ok(agentService.listEnabled());
    }
}
