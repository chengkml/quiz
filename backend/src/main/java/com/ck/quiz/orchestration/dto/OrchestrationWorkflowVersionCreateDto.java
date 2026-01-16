package com.ck.quiz.orchestration.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class OrchestrationWorkflowVersionCreateDto extends CreateDto {

    @NotBlank
    private String workflowId;

    @NotBlank
    private String definitionGraph;

    private String remark;
}

