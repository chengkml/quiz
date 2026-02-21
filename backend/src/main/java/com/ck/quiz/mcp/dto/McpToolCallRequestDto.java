package com.ck.quiz.mcp.dto;

import lombok.Data;

import java.util.Map;

/**
 * MCP 工具调用请求 DTO
 * 用于传输用户想要调用的工具及其参数
 */
@Data
public class McpToolCallRequestDto {

    /**
     * 服务器 ID
     */
    private String serverId;

    /**
     * 工具名称（originName）
     */
    private String toolName;

    /**
     * 工具的输入参数（根据 inputSchema 定义）
     */
    private Map<String, Object> arguments;
}
