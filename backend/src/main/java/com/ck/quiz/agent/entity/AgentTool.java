package com.ck.quiz.agent.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("智能体工具关联")
@EqualsAndHashCode(callSuper = true)
@Table(name = "agent_tool", indexes = {
    @Index(name = "idx_agent_tool_agent_id", columnList = "agentId")
})
public class AgentTool extends Model {

    @Column(length = 32, nullable = false)
    @Comment("智能体ID")
    private String agentId;

    @Column(length = 32, nullable = false)
    @Comment("MCP工具ID")
    private String mcpToolId;

    @Column
    @Comment("工具优先级")
    private Integer priority = 0;

    @Column(length = 2000)
    @Comment("工具特定配置JSON")
    private String config;
}
