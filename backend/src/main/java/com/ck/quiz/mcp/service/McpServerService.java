package com.ck.quiz.mcp.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mcp.dto.McpDiscoveredToolDto;
import com.ck.quiz.mcp.dto.McpServerCreateDto;
import com.ck.quiz.mcp.dto.McpServerDto;
import com.ck.quiz.mcp.dto.McpServerQueryDto;
import com.ck.quiz.mcp.dto.McpServerUpdateDto;
import com.ck.quiz.mcp.dto.McpToolImportItemDto;
import com.ck.quiz.mcp.dto.McpToolCallRequestDto;
import com.ck.quiz.mcp.dto.McpToolCallResultDto;
import com.ck.quiz.mcp.entity.McpServer;

import java.util.List;

public interface McpServerService
        extends BaseService<McpServerCreateDto, McpServerUpdateDto, McpServerQueryDto, McpServerDto, McpServer> {

    McpServerDto healthCheck(String userId, String serverId);

    List<McpDiscoveredToolDto> listDiscoveredTools(String serverId);

    /**
     * 调用 MCP 工具
     * 采用按需连接策略：每次调用都建立新连接 -> 初始化 -> 执行 -> 断开
     *
     * @param request 工具调用请求，包含 serverId、toolName、arguments
     * @return 工具执行结果
     */
    McpToolCallResultDto callTool(McpToolCallRequestDto request);

}
