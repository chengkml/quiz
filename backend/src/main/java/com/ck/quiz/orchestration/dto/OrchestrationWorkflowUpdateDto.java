package com.ck.quiz.orchestration.dto;

import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.orchestration.entity.OrchestrationWorkflow;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class OrchestrationWorkflowUpdateDto extends UpdateDto {

    @Size(max = 255)
    private String name;

    @Size(max = 4000)
    private String description;

    @Size(max = 128)
    private String bizDomain;

    private OrchestrationWorkflow.WorkflowStatus status;
}

