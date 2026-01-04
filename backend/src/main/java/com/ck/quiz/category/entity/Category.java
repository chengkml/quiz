package com.ck.quiz.category.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.Comment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 分类信息实体类
 * 示例：高等数学 -> 微积分 -> 导数
 */
@Entity
@Table(name = "category", indexes = {
        @Index(name = "idx_category_name", columnList = "name"),
        @Index(name = "idx_category_parent_id", columnList = "parent_id"),
        @Index(name = "idx_category_subject_id", columnList = "subject_id"),
        @Index(name = "idx_category_create_date", columnList = "create_date")
})
@Comment("分类信息实体类 示例：高等数学 -> 微积分 -> 导数")
@Data
@NoArgsConstructor
public class Category {

    @Id
    @Column(name = "category_id", length = 32, nullable = false)
    @Comment("分类 ID")
    private String id;

    @Column(name = "name", length = 64, nullable = false)
    @Comment("分类名称 示例：高等数学、微积分")
    private String name;

    @Column(name = "parent_id", length = 32)
    @Comment("父分类 ID（顶级分类为 null）")
    private String parentId;

    @Column(name = "subject_id", length = 32, nullable = false)
    @Comment("所属学科 ID")
    private String subjectId;

    @Column(name = "description", length = 255)
    @Comment("描述")
    private String description;

    @Column(name = "create_date", updatable = false)
    @Comment("创建日期")
    private LocalDateTime createDate;

    @Column(name = "create_user", length = 64, updatable = false)
    @Comment("创建用户")
    private String createUser;

    @Column(name = "update_date")
    @Comment("更新日期")
    private LocalDateTime updateDate;

    @Column(name = "update_user", length = 64)
    @Comment("更新用户")
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
