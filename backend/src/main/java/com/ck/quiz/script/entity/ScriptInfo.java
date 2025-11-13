package com.ck.quiz.script.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 脚本信息实体类
 * 用于管理脚本的元数据（类型、入口、路径等）
 */
@Entity
@Table(
        name = "script_info",
        indexes = {
                @Index(name = "idx_script_type", columnList = "script_type"),
                @Index(name = "idx_script_code", columnList = "script_code")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScriptInfo {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id;

    /**
     * 脚本编码（唯一标识）
     */
    @Column(name = "script_code", length = 64, nullable = false, unique = true)
    private String scriptCode;

    /**
     * 脚本名称
     */
    @Column(name = "script_name", length = 128, nullable = false)
    private String scriptName;

    /**
     * 脚本类型（python/shell/node/java/...）
     */
    @Column(name = "script_type", length = 32, nullable = false)
    private String scriptType;

    /**
     * 执行入口文件
     */
    @Column(name = "exec_entry", length = 256, nullable = false)
    private String execEntry;

    /**
     * 脚本文件或目录路径
     */
    @Column(name = "file_path", length = 512, nullable = false)
    private String filePath;

    /**
     * 脚本描述
     */
    @Lob
    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    /**
     * 启用状态
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "state", length = 20, nullable = false)
    private State state = State.ENABLED;

    /**
     * 创建时间
     */
    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    /**
     * 更新时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    @Column(name = "update_user", length = 64)
    private String updateUser;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            this.createUser = auth.getName();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            this.updateUser = auth.getName();
        }
    }

    /**
     * 启用状态枚举
     */
    public enum State {
        ENABLED,   // 启用
        DISABLED   // 禁用
    }
}
