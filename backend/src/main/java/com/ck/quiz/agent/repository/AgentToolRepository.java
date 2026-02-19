package com.ck.quiz.agent.repository;

import com.ck.quiz.agent.entity.AgentTool;
import com.ck.quiz.base.repository.BaseRepository;

import java.util.List;

public interface AgentToolRepository extends BaseRepository<AgentTool> {

    List<AgentTool> findByAgentId(String agentId);

    List<AgentTool> findByAgentIdOrderByPriorityDesc(String agentId);

    void deleteByAgentId(String agentId);

    List<AgentTool> findByMcpToolId(String mcpToolId);
}
