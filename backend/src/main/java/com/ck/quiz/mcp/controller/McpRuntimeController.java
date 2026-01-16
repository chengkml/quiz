package com.ck.quiz.mcp.controller;

import com.ck.quiz.mcp.dto.McpToolDto;
import com.ck.quiz.mcp.service.McpToolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Tag(name = "MCP运行时接口", description = "大模型运行时MCP工具查询接口")
@RestController
@RequestMapping("/runtime/mcp")
public class McpRuntimeController {

    private final McpToolService mcpToolService;

    public McpRuntimeController(McpToolService mcpToolService) {
        this.mcpToolService = mcpToolService;
    }

    @Operation(summary = "运行时查询可用工具列表")
    @GetMapping("/tools")
    public ResponseEntity<List<McpToolDto>> listRuntimeTools(
            @Parameter(description = "环境", required = true) @RequestParam("env") String env,
            @Parameter(description = "应用ID", required = false) @RequestParam(value = "appId", required = false) String appId) {
        return ResponseEntity.ok(mcpToolService.listRuntimeTools(env, appId));
    }
}

