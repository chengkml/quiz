package com.ck.quiz.mcp.dto;

import lombok.Data;

import java.util.Map;

@Data
public class McpDiscoveredToolDto {

    private String name;

    private String description;

    private Map<String, Object> inputSchema;

    private String originName;

    private String originDescription;

    private String schemaDigest;

    private Boolean registered;

    private String registeredToolId;
}

