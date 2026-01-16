package com.ck.quiz.mcp.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.mcp.entity.McpServer;

public interface McpServerRepository extends BaseRepository<McpServer> {

    McpServer findByIdentifier(String identifier);
}

