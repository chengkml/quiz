package com.ck.quiz.mermaids.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * Mermaid 思维图主表实体类
 */
@Entity
@Table(name = "mermaid_diagram", indexes = {
        @Index(name = "idx_mermaid_diagram_name", columnList = "diagram_name"),
        @Index(name = "idx_mermaid_diagram_create_date", columnList = "create_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MermaidDiagram {

    @Id
    @Column(name = "diagram_id", length = 32, nullable = false)
    private String id;

    /**
     * 图名称
     */
    @Column(name = "diagram_name", length = 255, nullable = false)
    private String diagramName;

    /**
     * 描述说明
     */
    @Lob
    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    /**
     * Mermaid 源码文本 (flowchart / sequence / class diagram 等完整内容)
     */
    @Lob
    @Column(name = "diagram_data", columnDefinition = "LONGTEXT")
    private String diagramData;

    @Column(name = "category_id", length = 32)
    private String categoryId;

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
