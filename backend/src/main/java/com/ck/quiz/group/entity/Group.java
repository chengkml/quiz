package com.ck.quiz.group.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.Comment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Comment("分组表")
@Table(name = "groups", indexes = {
    @Index(name = "idx_group_name_create_user", columnList = "name,create_user", unique = true)
})
public class Group {

    @Id
    @Comment("分组ID")
    @Column(name = "group_id", length = 32, nullable = false)
    private String id;

    @Comment("分组英文名")
    @Column(nullable = false, length = 128, unique = true)
    private String name;

    @Comment("分组中文名")
    @Column(nullable = false, length = 256, unique = true)
    private String label;

    @Comment("分组描述")
    @Column(length = 512)
    private String descr;

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