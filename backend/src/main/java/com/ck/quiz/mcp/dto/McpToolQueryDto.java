package com.ck.quiz.mcp.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class McpToolQueryDto extends QueryDto {

    private String env;

    private String serverId;

    private String status;

    private String category;
}

