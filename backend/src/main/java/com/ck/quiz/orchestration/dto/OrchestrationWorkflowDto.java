package com.ck.quiz.orchestration.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.orchestration.entity.OrchestrationWorkflow;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class OrchestrationWorkflowDto extends Dto {

    private String code;

    private String name;

    private String description;

    private String bizDomain;

    private OrchestrationWorkflow.WorkflowStatus status;

    private String currentVersionId;
}

