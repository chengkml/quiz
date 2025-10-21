package com.ck.quiz.llmmodel.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 大语言模型实体类
 */
@Entity
@Table(
        name = "llm_model",
        indexes = {
                @Index(name = "idx_model_name", columnList = "name"),
                @Index(name = "idx_model_provider", columnList = "provider"),
                @Index(name = "idx_model_status", columnList = "status")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LLMModel {

    @Id
    @Column(name = "model_id", length = 32, nullable = false)
    private String id;

    /**
     * 模型名称
     */
    @Column(name = "name", length = 100, nullable = false)
    private String name;

    /**
     * 模型提供商
     */
    @Column(name = "provider", length = 50, nullable = false)
    private String provider;

    /**
     * 模型类型：如 text, chat, embedding 等
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false)
    private ModelType type;

    /**
     * 模型描述
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * API 密钥（加密存储）
     */
    @Column(name = "api_key", length = 200)
    private String apiKey;

    /**
     * API 端点
     */
    @Column(name = "api_endpoint", length = 200)
    private String apiEndpoint;

    /**
     * 上下文窗口大小
     */
    @Column(name = "context_window")
    private Integer contextWindow;

    /**
     * 输入token单价（分/千token）
     */
    @Column(name = "input_price_per_1k")
    private Double inputPricePer1k;

    /**
     * 输出token单价（分/千token）
     */
    @Column(name = "output_price_per_1k")
    private Double outputPricePer1k;

    /**
     * 是否为默认模型
     */
    @Column(name = "is_default")
    private String isDefault = "0";

    /**
     * 模型状态：ACTIVE, INACTIVE
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ModelStatus status;

    /**
     * 配置信息（JSON格式）
     */
    @Lob
    @Column(name = "config", columnDefinition = "LONGTEXT")
    private String config;

    /**
     * 创建时间
     */
    @Column(name = "create_date")
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    @Column(name = "create_user", length = 50)
    private String createUser;

    /**
     * 更新时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    @Column(name = "update_user", length = 50)
    private String updateUser;

    /**
     * 模型类型枚举
     */
    public enum ModelType {
        TEXT,
        CHAT,
        EMBEDDING,
        MULTIMODAL
    }

    /**
     * 模型状态枚举
     */
    public enum ModelStatus {
        ACTIVE,
        INACTIVE
    }

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.createUser = authentication.getName();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.updateUser = authentication.getName();
        }
    }
}