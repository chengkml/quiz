package com.ck.quiz.mcp.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * MCP 工具调用结果 DTO
 * 用于返回工具执行的结果
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class McpToolCallResultDto {

    /**
     * 工具名称
     */
    private String toolName;

    /**
     * 是否调用成功
     */
    private Boolean success;

    /**
     * 返回的内容列表
     * 通常包含文本或其他结构的数据
     */
    private List<Map<String, Object>> content;

    /**
     * 错误信息（当失败时）
     */
    private String errorMessage;

    /**
     * 原始响应数据（如需调试使用）
     */
    private Map<String, Object> rawResponse;

    /**
     * 调用耗时（毫秒）
     */
    private Long duration;

    public McpToolCallResultDto(String toolName, Boolean success, List<Map<String, Object>> content) {
        this.toolName = toolName;
        this.success = success;
        this.content = content;
    }

    public McpToolCallResultDto(String toolName, Boolean success, String errorMessage) {
        this.toolName = toolName;
        this.success = success;
        this.errorMessage = errorMessage;
    }
}
