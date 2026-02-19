package com.ck.quiz.agent.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("智能体")
@EqualsAndHashCode(callSuper = true)
@Table(name = "agent", indexes = {
    @Index(name = "idx_agent_identifier", columnList = "identifier"),
    @Index(name = "idx_agent_status", columnList = "status"),
    @Index(name = "idx_agent_category", columnList = "category")
})
public class Agent extends Model {

    @Column(length = 128, nullable = false)
    @Comment("智能体名称")
    private String name;

    @Column(length = 128, unique = true)
    @Comment("智能体标识符")
    private String identifier;

    @Column(length = 512)
    @Comment("智能体描述")
    private String description;

    @Column(length = 256)
    @Comment("图标")
    private String icon;

    @Column(length = 64)
    @Comment("分类")
    private String category;

    @Column(columnDefinition = "TEXT")
    @Comment("系统提示词")
    private String systemPrompt;

    @Column(length = 32)
    @Comment("提示词模板ID")
    private String promptTemplateId;

    @Column(length = 32)
    @Comment("关联的LLM模型ID")
    private String modelId;

    @Column(length = 2000)
    @Comment("模型参数配置JSON")
    private String modelConfig;

    @Column(length = 32, nullable = false)
    @Comment("状态: DRAFT/ENABLED/DISABLED")
    private String status = "DRAFT";

    @Column(length = 512)
    @Comment("标签")
    private String tags;
}
