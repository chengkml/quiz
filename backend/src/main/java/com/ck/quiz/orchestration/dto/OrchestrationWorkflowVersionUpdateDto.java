package com.ck.quiz.orchestration.dto;

import com.ck.quiz.base.dto.UpdateDto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class OrchestrationWorkflowVersionUpdateDto extends UpdateDto {

    @NotBlank
    private String definitionGraph;

    private String remark;
}

