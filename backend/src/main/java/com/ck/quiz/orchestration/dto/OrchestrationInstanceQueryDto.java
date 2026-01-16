package com.ck.quiz.orchestration.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.orchestration.entity.OrchestrationInstance;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
public class OrchestrationInstanceQueryDto extends QueryDto {

    private String workflowId;

    private OrchestrationInstance.InstanceStatus status;
}

