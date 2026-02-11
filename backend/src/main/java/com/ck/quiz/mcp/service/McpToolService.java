package com.ck.quiz.mcp.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mcp.dto.McpToolCreateDto;
import com.ck.quiz.mcp.dto.McpToolDto;
import com.ck.quiz.mcp.dto.McpToolQueryDto;
import com.ck.quiz.mcp.dto.McpToolUpdateDto;
import com.ck.quiz.mcp.entity.McpTool;


public interface McpToolService
        extends BaseService<McpToolCreateDto, McpToolUpdateDto, McpToolQueryDto, McpToolDto, McpTool> {

}

