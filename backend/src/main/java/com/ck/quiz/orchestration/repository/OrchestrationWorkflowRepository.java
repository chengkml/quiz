package com.ck.quiz.orchestration.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.orchestration.entity.OrchestrationWorkflow;

import java.util.Optional;

public interface OrchestrationWorkflowRepository extends BaseRepository<OrchestrationWorkflow> {

    Optional<OrchestrationWorkflow> findByIdAndCreateUser(String id, String createUser);

    Optional<OrchestrationWorkflow> findByCodeAndCreateUser(String code, String createUser);
}

