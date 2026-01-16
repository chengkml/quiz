package com.ck.quiz.mcp.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mcp.dto.McpDiscoveredToolDto;
import com.ck.quiz.mcp.dto.McpServerCreateDto;
import com.ck.quiz.mcp.dto.McpServerDto;
import com.ck.quiz.mcp.dto.McpServerQueryDto;
import com.ck.quiz.mcp.dto.McpServerUpdateDto;
import com.ck.quiz.mcp.dto.McpToolImportItemDto;
import com.ck.quiz.mcp.entity.McpServer;

import java.util.List;

public interface McpServerService
        extends BaseService<McpServerCreateDto, McpServerUpdateDto, McpServerQueryDto, McpServerDto, McpServer> {

    void healthCheck(String userId, String serverId);

    List<McpDiscoveredToolDto> listDiscoveredTools(String serverId);

    List<String> importTools(String userId, String serverId, List<McpToolImportItemDto> tools);
}

