package com.ck.quiz.agent.repository;

import com.ck.quiz.agent.entity.Agent;
import com.ck.quiz.base.repository.BaseRepository;

import java.util.List;
import java.util.Optional;

public interface AgentRepository extends BaseRepository<Agent> {

    Optional<Agent> findByIdentifier(String identifier);

    List<Agent> findByStatus(String status);

    List<Agent> findByCategory(String category);

    List<Agent> findByCategoryAndStatus(String category, String status);
}
