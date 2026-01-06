package com.ck.quiz.llmmodel.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import com.ck.quiz.base.entity.Model;

@Data
@Entity
@Comment("大语言模型表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "llm_model", indexes = {
        @Index(name = "idx_model_name", columnList = "name"),
        @Index(name = "idx_model_provider", columnList = "provider")
})
public class LLMModel extends Model {

    @Column(length = 100, nullable = false)
    @Comment("模型名称")
    private String name;

    @Column(length = 50, nullable = false)
    @Comment("模型提供商")
    private String provider;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("模型类型")
    private ModelType type;

    @Column(length = 500)
    @Comment("模型描述")
    private String descr;

    @Column(length = 200)
    @Comment("API密钥")
    private String apiKey;

    @Column(length = 200)
    @Comment("API端点")
    private String apiEndpoint;

    @Comment("上下文窗口大小")
    private Integer contextWindow;

    @Comment("输入token单价")
    private Double inputPricePer1k;

    @Comment("输出token单价")
    private Double outputPricePer1k;

    @Comment("是否为默认模型")
    private String isDefault = "0";

    @Column(length = 500)
    @Comment("配置信息")
    private String config;

    public enum ModelType {
        TEXT,
        VISION,
        VOICE,
        IMAGE
    }
}