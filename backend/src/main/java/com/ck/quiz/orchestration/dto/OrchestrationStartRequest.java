package com.ck.quiz.orchestration.dto;

import com.ck.quiz.orchestration.entity.OrchestrationInstance;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrchestrationStartRequest {

    @NotNull
    private OrchestrationInstance.TriggerType triggerType;

    private String triggerParams;

    private String workflowVersionId;

    private DatasetContext datasetContext;

    @Data
    public static class DatasetContext {
        private java.util.List<String> datasetIds;
        private java.util.Map<String, Object> variables;
    }
}

