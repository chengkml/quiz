package com.ck.quiz.mcp.dto;

import lombok.Data;

import java.util.List;

@Data
public class McpToolMetricsResponseDto {

    private List<McpToolMetricsPointDto> successRate;

    private List<McpToolMetricsPointDto> latencyP95;

    private List<McpToolMetricsPointDto> latencyP99;
}

