package com.ck.quiz.mcp.dto;

import lombok.Data;

@Data
public class McpDiscoveredToolDto {

    private String originName;

    private String originDescription;

    private String schemaDigest;

    private Boolean registered;

    private String registeredToolId;
}

