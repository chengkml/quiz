package com.ck.quiz.mcp.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.mcp.entity.McpTool;

import java.util.List;

public interface McpToolRepository extends BaseRepository<McpTool> {

    List<McpTool> findByServerId(String serverId);

    List<McpTool> findByEnvAndStatus(String env, String status);

    List<McpTool> findByEnvAndStatusAndVisibilityJsonContaining(String env, String status, String appId);
}

