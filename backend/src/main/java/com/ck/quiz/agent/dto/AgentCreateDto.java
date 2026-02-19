package com.ck.quiz.agent.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class AgentCreateDto extends CreateDto {

    @NotBlank(message = "智能体名称不能为空")
    @Size(max = 128, message = "智能体名称不能超过128个字符")
    private String name;

    @Size(max = 128, message = "智能体标识符不能超过128个字符")
    private String identifier;

    @Size(max = 512, message = "描述不能超过512个字符")
    private String description;

    @Size(max = 256, message = "图标不能超过256个字符")
    private String icon;

    @Size(max = 64, message = "分类不能超过64个字符")
    private String category;

    private String systemPrompt;

    @Size(max = 32, message = "提示词模板ID不能超过32个字符")
    private String promptTemplateId;

    @Size(max = 32, message = "模型ID不能超过32个字符")
    private String modelId;

    @Size(max = 2000, message = "模型配置不能超过2000个字符")
    private String modelConfig;

    private String status;

    @Size(max = 512, message = "标签不能超过512个字符")
    private String agentTags;

    /**
     * 关联的MCP工具ID列表
     */
    private List<String> toolIds;
}
