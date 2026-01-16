package com.ck.quiz.orchestration.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.orchestration.entity.OrchestrationInstance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface OrchestrationInstanceRepository extends BaseRepository<OrchestrationInstance> {

    Page<OrchestrationInstance> findByWorkflowId(String workflowId, Pageable pageable);

    Page<OrchestrationInstance> findByWorkflowIdAndStatus(String workflowId, OrchestrationInstance.InstanceStatus status, Pageable pageable);
}

