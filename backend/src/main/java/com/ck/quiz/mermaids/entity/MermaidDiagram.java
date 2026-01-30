package com.ck.quiz.mermaids.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * Mermaid 思维图主表实体类
 */
@Data
@Entity
@Table(name = "mermaid_diagram", indexes = {
        @Index(name = "idx_mermaid_diagram_name", columnList = "diagram_name"),
        @Index(name = "idx_mermaid_diagram_create_date", columnList = "create_date")
})
@EqualsAndHashCode(callSuper = true)
public class MermaidDiagram extends Model {

    /**
     * 图名称
     */
    @Column(name = "diagram_name", length = 255, nullable = false)
    private String diagramName;

    /**
     * 描述说明
     */
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    /**
     * Mermaid 源码文本 (flowchart / sequence / class diagram 等完整内容)
     */
    @Column(name = "diagram_data", columnDefinition = "TEXT")
    private String diagramData;

    // Remove prePersist/preUpdate as Model handles it
}
