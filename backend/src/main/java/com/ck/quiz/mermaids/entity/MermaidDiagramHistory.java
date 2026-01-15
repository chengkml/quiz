package com.ck.quiz.mermaids.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * Mermaid 思维图版本历史记录表
 */
@Entity
@Table(name = "mermaid_diagram_history", indexes = {
        @Index(name = "idx_mermaid_history_diagram_id", columnList = "diagram_id"),
        @Index(name = "idx_mermaid_history_create_date", columnList = "create_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MermaidDiagramHistory {

    @Id
    @Column(name = "history_id", length = 32, nullable = false)
    private String id;

    /**
     * 所属主图 ID
     */
    @Column(name = "diagram_id", length = 32, nullable = false)
    private String diagramId;

    /**
     * 版本号（从1递增）
     */
    @Column(name = "version_num", nullable = false)
    private Integer versionNum;

    /**
     * Mermaid 源码文本
     */
    @Lob
    @Column(name = "diagram_data", columnDefinition = "TEXT")
    private String diagramData;

    /**
     * 版本描述
     */
    @Column(name = "description", length = 255)
    private String description;

    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.createUser = authentication.getName();
        }
    }
}
