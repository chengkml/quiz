package com.ck.quiz.agent.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class AgentQueryDto extends QueryDto {

    private String status;

    private String category;

    private String modelId;
}
