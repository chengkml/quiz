package com.ck.quiz.orchestration.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class OrchestrationWorkflowVersionDto extends Dto {

    private String workflowId;

    private Integer versionNumber;

    private String definitionGraph;

    private String remark;
}

