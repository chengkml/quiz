package com.ck.quiz.mcp.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class McpToolDto extends Dto {

    private String serverId;

    private String env;

    private String originName;

    private String displayName;

    private String description;

    private String category;

    private String tags;

    private String status;

    private String schemaJson;

    private String strategyJson;

    private String visibilityJson;

    private Boolean sourceDeletedFlag;
}

