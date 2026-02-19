package com.ck.quiz.agent.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class AgentDto extends Dto {

    private String name;

    private String identifier;

    private String description;

    private String icon;

    private String category;

    private String systemPrompt;

    private String promptTemplateId;

    private String promptTemplateName;

    private String modelId;

    private String modelName;

    private String modelConfig;

    private String status;

    private String agentTags;

    /**
     * 关联的工具数量
     */
    private Integer toolCount;

    /**
     * 关联的工具列表（详情时填充）
     */
    private List<AgentToolDto> tools;
}
