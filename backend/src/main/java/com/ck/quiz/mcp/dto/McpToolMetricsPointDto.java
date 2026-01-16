package com.ck.quiz.mcp.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class McpToolMetricsPointDto {

    private LocalDateTime timestamp;

    private Double value;
}

