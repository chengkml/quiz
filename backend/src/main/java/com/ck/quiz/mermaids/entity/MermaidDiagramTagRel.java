package com.ck.quiz.mermaids.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Mermaid 图 - 标签关系（多对多）
 */
@Entity
@Table(
        name = "mermaid_diagram_tag_rel",
        indexes = {
                @Index(name = "idx_diagram_id", columnList = "diagram_id"),
                @Index(name = "idx_tag_id", columnList = "tag_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MermaidDiagramTagRel {

    @Id
    @Column(name = "rel_id", length = 32, nullable = false)
    private String id;

    @Column(name = "diagram_id", length = 32, nullable = false)
    private String diagramId;

    @Column(name = "tag_id", length = 32, nullable = false)
    private String tagId;

    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
    }
}
