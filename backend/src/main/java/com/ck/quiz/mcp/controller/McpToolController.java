package com.ck.quiz.mcp.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mcp.dto.McpToolCreateDto;
import com.ck.quiz.mcp.dto.McpToolDto;
import com.ck.quiz.mcp.dto.McpToolMetricsResponseDto;
import com.ck.quiz.mcp.dto.McpToolQueryDto;
import com.ck.quiz.mcp.dto.McpToolUpdateDto;
import com.ck.quiz.mcp.service.McpToolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@Tag(name = "MCP工具管理", description = "MCP工具管理相关API")
@RestController
@RequestMapping("/api/mcp/tool")
public class McpToolController
        extends BaseController<McpToolCreateDto, McpToolUpdateDto, McpToolQueryDto, McpToolDto> {

    private final McpToolService mcpToolService;

    public McpToolController(McpToolService mcpToolService) {
        this.mcpToolService = mcpToolService;
    }

    @Override
    protected BaseService<McpToolCreateDto, McpToolUpdateDto, McpToolQueryDto, McpToolDto, ?> getService() {
        return mcpToolService;
    }

    @Operation(summary = "启用工具")
    @PostMapping("/{id}/enable")
    public ResponseEntity<Void> enable(
            @Parameter(description = "工具ID", required = true) @PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        mcpToolService.enable(authentication.getName(), id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "禁用工具")
    @PostMapping("/{id}/disable")
    public ResponseEntity<Void> disable(
            @Parameter(description = "工具ID", required = true) @PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        mcpToolService.disable(authentication.getName(), id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "复制工具配置到其他环境")
    @PutMapping("/{id}/clone-config")
    public ResponseEntity<String> cloneConfig(
            @Parameter(description = "工具ID", required = true) @PathVariable("id") String id,
            @Parameter(description = "目标环境", required = true) @RequestParam("targetEnv") String targetEnv) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(mcpToolService.cloneConfig(authentication.getName(), id, targetEnv));
    }

    @Operation(summary = "查询工具指标")
    @GetMapping("/{id}/metrics")
    public ResponseEntity<McpToolMetricsResponseDto> metrics(
            @Parameter(description = "工具ID", required = true) @PathVariable("id") String id,
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        return ResponseEntity.ok(mcpToolService.queryMetrics(id, from, to));
    }
}

