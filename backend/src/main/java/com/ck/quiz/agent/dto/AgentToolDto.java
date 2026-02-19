package com.ck.quiz.agent.dto;

import lombok.Data;

@Data
public class AgentToolDto {

    private String id;

    private String agentId;

    private String mcpToolId;

    private String mcpToolName;

    private String mcpToolDescription;

    private Integer priority;

    private String config;
}
