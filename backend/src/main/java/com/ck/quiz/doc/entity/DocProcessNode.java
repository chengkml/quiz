package com.ck.quiz.doc.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "doc_process_node",
        indexes = {@Index(name = "idx_doc_id", columnList = "doc_id")})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocProcessNode {

    @Id
    @Column(name = "node_id", length = 32, nullable = false)
    private String id;

    @Column(name = "doc_id", length = 32, nullable = false)
    private String docId;

    @Column(name = "heading_id", length = 32)
    private String headingId; // 关联的5级标题

    @Column(name = "sequence_no")
    private Integer sequenceNo;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
    }
}
