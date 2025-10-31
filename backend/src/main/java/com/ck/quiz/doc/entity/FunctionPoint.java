package com.ck.quiz.doc.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "function_point",
        indexes = {@Index(name = "idx_parent_id", columnList = "parent_id")})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FunctionPoint {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id;

    @Column(name = "doc_id", length = 32, nullable = false)
    private String docId;

    @Column(name = "parent_id", length = 32)
    private String parentId; // 上级功能点ID，NULL表示一级功能点

    @Column(name = "name", length = 255, nullable = false)
    private String name; // 功能点名称

    @Column(name = "level")
    private Integer level; // 功能点层级，可选，用于快速查询层级

    @Column(name = "type", length = 50)
    private String type; // 功能点类型，可选，如模块、子模块、功能

    @Column(name = "business_desc", columnDefinition = "TEXT")
    private String businessDesc; // 业务描述，最下级功能点填写

    @Column(name = "process_summary", columnDefinition = "TEXT")
    private String processSummary; // 流程简介，最下级功能点填写

    @Column(name = "function_desc", columnDefinition = "TEXT")
    private String functionDesc; // 功能描述，最下级功能点填写

    @Column(name = "order_num")
    private Integer orderNum; // 同级排序号

    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @Column(name = "update_date")
    private LocalDateTime updateDate;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
    }
}
