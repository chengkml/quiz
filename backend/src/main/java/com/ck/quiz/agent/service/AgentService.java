package com.ck.quiz.agent.service;

import com.ck.quiz.agent.dto.*;
import com.ck.quiz.agent.entity.Agent;
import com.ck.quiz.base.service.BaseService;

import java.util.List;

public interface AgentService
        extends BaseService<AgentCreateDto, AgentUpdateDto, AgentQueryDto, AgentDto, Agent> {

    /**
     * 启用智能体
     */
    AgentDto enable(String userId, String id);

    /**
     * 禁用智能体
     */
    AgentDto disable(String userId, String id);

    /**
     * 复制智能体
     */
    AgentDto duplicate(String userId, String id);

    /**
     * 获取智能体关联的工具列表
     */
    List<AgentToolDto> getTools(String userId, String agentId);

    /**
     * 批量更新智能体工具关联
     */
    List<AgentToolDto> updateTools(String userId, String agentId, AgentToolBatchDto batchDto);

    /**
     * 获取所有已启用的智能体列表
     */
    List<AgentDto> listEnabled();
}
