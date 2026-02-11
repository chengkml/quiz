package com.ck.quiz.mcp.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mcp.dto.McpToolCreateDto;
import com.ck.quiz.mcp.dto.McpToolDto;
import com.ck.quiz.mcp.dto.McpToolQueryDto;
import com.ck.quiz.mcp.dto.McpToolUpdateDto;
import com.ck.quiz.mcp.service.McpToolService;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


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

}

