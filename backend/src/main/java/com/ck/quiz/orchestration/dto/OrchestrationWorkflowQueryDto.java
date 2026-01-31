package com.ck.quiz.orchestration.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.orchestration.entity.OrchestrationWorkflow;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class OrchestrationWorkflowQueryDto extends QueryDto {

    private OrchestrationWorkflow.WorkflowStatus status;

}
