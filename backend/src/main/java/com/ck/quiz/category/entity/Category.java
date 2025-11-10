package com.ck.quiz.category.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 分类信息实体类
 * 示例：高等数学 -> 微积分 -> 导数
 */
@Entity
@Table(
        name = "category",
        indexes = {
                @Index(name = "idx_category_name", columnList = "name"),
                @Index(name = "idx_category_parent_id", columnList = "parent_id"),
                @Index(name = "idx_category_subject_id", columnList = "subject_id"),
                @Index(name = "idx_category_create_date", columnList = "create_date")
        }
)
@Data
@NoArgsConstructor
public class Category {

    @Id
    @Column(name = "category_id", length = 32, nullable = false)
    private String id;

    /**
     * 分类名称
     * 示例：高等数学、微积分
     */
    @Column(name = "name", length = 64, nullable = false)
    private String name;

    /**
     * 父分类 ID（顶级分类为 null）
     */
    @Column(name = "parent_id", length = 32)
    private String parentId;

    /**
     * 所属学科 ID
     */
    @Column(name = "subject_id", length = 32, nullable = false)
    private String subjectId;



    /**
     * 描述
     */
    @Column(name = "description", length = 255)
    private String description;

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
