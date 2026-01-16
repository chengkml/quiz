package com.ck.quiz.orchestration.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.orchestration.entity.OrchestrationWorkflowVersion;

import java.util.List;
import java.util.Optional;

public interface OrchestrationWorkflowVersionRepository extends BaseRepository<OrchestrationWorkflowVersion> {

    List<OrchestrationWorkflowVersion> findByWorkflowIdOrderByVersionNumberDesc(String workflowId);

    Optional<OrchestrationWorkflowVersion> findFirstByWorkflowIdOrderByVersionNumberDesc(String workflowId);
}

