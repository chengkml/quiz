package com.ck.quiz.agent.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AgentToolBatchDto {

    @NotEmpty(message = "工具ID列表不能为空")
    private List<AgentToolItemDto> tools;

    @Data
    public static class AgentToolItemDto {
        private String mcpToolId;
        private Integer priority;
        private String config;
    }
}
