package com.ck.quiz.orchestration.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.orchestration.entity.OrchestrationInstance;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@EqualsAndHashCode(callSuper = true)
@Data
public class OrchestrationInstanceDto extends Dto {

    private String workflowId;

    private String workflowVersionId;

    private OrchestrationInstance.InstanceStatus status;

    private OrchestrationInstance.TriggerType triggerType;

    private String triggerParams;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private String errorSummary;
}

