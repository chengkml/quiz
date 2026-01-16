package com.ck.quiz.mcp.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mcp.dto.McpDiscoveredToolDto;
import com.ck.quiz.mcp.dto.McpServerCreateDto;
import com.ck.quiz.mcp.dto.McpServerDto;
import com.ck.quiz.mcp.dto.McpServerQueryDto;
import com.ck.quiz.mcp.dto.McpServerUpdateDto;
import com.ck.quiz.mcp.dto.McpToolImportItemDto;
import com.ck.quiz.mcp.service.McpServerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "MCP服务器管理", description = "MCP服务器管理相关API")
@RestController
@RequestMapping("/api/mcp/server")
public class McpServerController
        extends BaseController<McpServerCreateDto, McpServerUpdateDto, McpServerQueryDto, McpServerDto> {

    private final McpServerService mcpServerService;

    public McpServerController(McpServerService mcpServerService) {
        this.mcpServerService = mcpServerService;
    }

    @Override
    protected BaseService<McpServerCreateDto, McpServerUpdateDto, McpServerQueryDto, McpServerDto, ?> getService() {
        return mcpServerService;
    }

    @Operation(summary = "MCP服务器健康检查")
    @PostMapping("/{id}/health-check")
    public ResponseEntity<Void> healthCheck(
            @Parameter(description = "服务器ID", required = true) @PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        mcpServerService.healthCheck(authentication.getName(), id);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "查询已发现的工具列表")
    @GetMapping("/{id}/discovered-tools")
    public ResponseEntity<List<McpDiscoveredToolDto>> listDiscoveredTools(
            @Parameter(description = "服务器ID", required = true) @PathVariable("id") String id) {
        return ResponseEntity.ok(mcpServerService.listDiscoveredTools(id));
    }

    @Operation(summary = "从MCP服务器导入工具")
    @PostMapping("/{id}/tools/import")
    public ResponseEntity<List<String>> importTools(
            @Parameter(description = "服务器ID", required = true) @PathVariable("id") String id,
            @RequestBody @Valid List<McpToolImportItemDto> tools) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(mcpServerService.importTools(authentication.getName(), id, tools));
    }
}

