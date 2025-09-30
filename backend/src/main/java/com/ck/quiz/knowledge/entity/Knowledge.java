package com.ck.quiz.knowledge.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 知识点信息实体类
 * 示例：导数定义、链式法则
 */
@Entity
@Table(
        name = "knowledge",
        indexes = {
                @Index(name = "idx_kp_name", columnList = "name"),
                @Index(name = "idx_kp_category_id", columnList = "category_id"),
                @Index(name = "idx_kp_subject_id", columnList = "subject_id"),
                @Index(name = "idx_kp_create_date", columnList = "create_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Knowledge {

    @Id
    @Column(name = "kp_id", length = 32, nullable = false)
    private String id;

    /**
     * 知识点名称
     * 示例：导数定义、链式法则
     */
    @Column(name = "name", length = 64, nullable = false)
    private String name;

    /**
     * 知识点描述
     */
    @Column(name = "description", length = 255)
    private String description;

    /**
     * 所属分类 ID
     */
    @Column(name = "category_id", length = 32, nullable = false)
    private String categoryId;

    /**
     * 所属学科 ID
     */
    @Column(name = "subject_id", length = 32, nullable = false)
    private String subjectId;

    /**
     * 难度等级（1-5）
     */
    @Column(name = "difficulty_level")
    private Integer difficultyLevel;

    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    @Column(name = "update_date")
    private LocalDateTime updateDate;

    @Column(name = "update_user", length = 64)
    private String updateUser;

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
