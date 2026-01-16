package com.ck.quiz.orchestration.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.orchestration.dto.*;
import com.ck.quiz.orchestration.entity.OrchestrationWorkflow;
import org.springframework.data.domain.Page;

import java.util.List;

public interface OrchestrationWorkflowService extends BaseService<OrchestrationWorkflowCreateDto, OrchestrationWorkflowUpdateDto, OrchestrationWorkflowQueryDto, OrchestrationWorkflowDto, OrchestrationWorkflow> {

    OrchestrationWorkflowDto publish(String userId, String workflowId, String versionId);

    OrchestrationWorkflowVersionDto createVersion(String userId, OrchestrationWorkflowVersionCreateDto createDto);

    OrchestrationWorkflowVersionDto updateVersion(String userId, OrchestrationWorkflowVersionUpdateDto updateDto);

    List<OrchestrationWorkflowVersionDto> listVersions(String userId, String workflowId);

    OrchestrationWorkflowVersionDto getLatestVersion(String userId, String workflowId);

    OrchestrationInstanceDto start(String userId, String workflowId, OrchestrationStartRequest startRequest);

    Page<OrchestrationInstanceDto> searchInstances(String userId, OrchestrationInstanceQueryDto queryDto);
}

