package com.ck.quiz.mermaids.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * Mermaid 分类实体
 */
@Entity
@Table(
        name = "mermaid_category",
        indexes = {
                @Index(name = "idx_mermaid_category_name", columnList = "category_name")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MermaidCategory {

    @Id
    @Column(name = "category_id", length = 32, nullable = false)
    private String id;

    /** 分类名称 */
    @Column(name = "category_name", length = 128, nullable = false)
    private String categoryName;

    /** 描述说明 */
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
}
