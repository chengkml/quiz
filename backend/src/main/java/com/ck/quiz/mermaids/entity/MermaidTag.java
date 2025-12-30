package com.ck.quiz.mermaids.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * Mermaid 标签实体
 */
@Entity
@Table(
        name = "mermaid_tag",
        indexes = {
                @Index(name = "idx_mermaid_tag_name", columnList = "tag_name")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MermaidTag {

    @Id
    @Column(name = "tag_id", length = 32, nullable = false)
    private String id;

    /** 标签名称 */
    @Column(name = "tag_name", length = 64, nullable = false)
    private String tagName;

    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            this.createUser = auth.getName();
        }
    }
}
