package com.ck.quiz.mcp.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mcp.dto.McpToolCreateDto;
import com.ck.quiz.mcp.dto.McpToolDto;
import com.ck.quiz.mcp.dto.McpToolMetricsResponseDto;
import com.ck.quiz.mcp.dto.McpToolQueryDto;
import com.ck.quiz.mcp.dto.McpToolUpdateDto;
import com.ck.quiz.mcp.entity.McpTool;

import java.time.LocalDateTime;
import java.util.List;

public interface McpToolService
        extends BaseService<McpToolCreateDto, McpToolUpdateDto, McpToolQueryDto, McpToolDto, McpTool> {

    void enable(String userId, String id);

    void disable(String userId, String id);

    String cloneConfig(String userId, String id, String targetEnv);

    List<McpToolDto> listRuntimeTools(String env, String appId);

    McpToolMetricsResponseDto queryMetrics(String toolId, LocalDateTime from, LocalDateTime to);
}

