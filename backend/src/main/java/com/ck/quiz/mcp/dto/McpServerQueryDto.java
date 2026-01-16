package com.ck.quiz.mcp.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class McpServerQueryDto extends QueryDto {

    private String env;

    private String status;
}

