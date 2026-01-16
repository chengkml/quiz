package com.ck.quiz.orchestration.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class OrchestrationWorkflowVersionQueryDto extends QueryDto {

    private String workflowId;
}

