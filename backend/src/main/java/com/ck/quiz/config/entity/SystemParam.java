package com.ck.quiz.config.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 系统参数实体类
 */
@Entity
@Table(
        name = "system_param",
        indexes = {
                @Index(name = "idx_system_param_key", columnList = "param_key", unique = true),
                @Index(name = "idx_system_param_category", columnList = "category"),
                @Index(name = "idx_system_param_status", columnList = "status")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemParam {

    /**
     * 参数ID
     */
    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id;

    /**
     * 参数键（唯一标识）
     */
    @Column(name = "param_key", length = 100, nullable = false, unique = true)
    private String paramKey;

    /**
     * 参数名称
     */
    @Column(name = "param_name", length = 200, nullable = false)
    private String paramName;

    /**
     * 参数值
     */
    @Lob
    @Column(name = "param_value", columnDefinition = "TEXT")
    private String paramValue;

    /**
     * 默认值
     */
    @Lob
    @Column(name = "default_value", columnDefinition = "TEXT")
    private String defaultValue;

    /**
     * 参数类型：STRING, NUMBER, BOOLEAN, JSON, LIST
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "param_type", length = 20, nullable = false)
    private ParamType paramType = ParamType.STRING;

    /**
     * 参数分类（用于分组管理）
     */
    @Column(name = "category", length = 100)
    private String category;

    /**
     * 参数描述
     */
    @Column(name = "description", length = 500)
    private String description;

    /**
     * 是否加密存储
     */
    @Column(name = "is_encrypted", nullable = false)
    private Boolean isEncrypted = false;

    /**
     * 是否只读（不允许修改）
     */
    @Column(name = "is_readonly", nullable = false)
    private Boolean isReadonly = false;

    /**
     * 状态：ACTIVE, INACTIVE
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ParamStatus status = ParamStatus.ACTIVE;

    /**
     * 排序号
     */
    @Column(name = "sort_order")
    private Integer sortOrder;

    /**
     * 创建人
     */
    @Column(name = "create_user", length = 64)
    private String createUser;

    /**
     * 创建时间
     */
    @Column(name = "create_date", nullable = false, updatable = false)
    private LocalDateTime createDate;

    /**
     * 更新人
     */
    @Column(name = "update_user", length = 64)
    private String updateUser;

    /**
     * 更新时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 参数类型枚举
     */
    public enum ParamType {
        STRING,    // 字符串
        NUMBER,    // 数字
        BOOLEAN,   // 布尔值
        JSON,      // JSON对象
        LIST       // 列表
    }

    /**
     * 参数状态枚举
     */
    public enum ParamStatus {
        ACTIVE,    // 启用
        INACTIVE   // 禁用
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
