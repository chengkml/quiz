package com.ck.quiz.datasource.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 数据表结构实体
 * 用于存储数据库中各个表的元数据
 */
@Entity
@Table(
        name = "table_schema",
        indexes = {
                @Index(name = "idx_table_schema_name", columnList = "table_name"),
                @Index(name = "idx_table_schema_schem", columnList = "table_schem")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TableSchema {

    @Id
    @Column(name = "table_id", length = 32, nullable = false)
    private String id;

    /**
     * 数据库目录（Catalog）
     */
    @Column(name = "table_cat", length = 100)
    private String tableCat;

    /**
     * 数据库模式（Schema）
     */
    @Column(name = "table_schem", length = 100)
    private String tableSchem;

    /**
     * 表名
     */
    @Column(name = "table_name", length = 200, nullable = false)
    private String tableName;

    /**
     * 表类型（TABLE、VIEW等）
     */
    @Column(name = "table_type", length = 50)
    private String tableType;

    /**
     * 表注释
     */
    @Column(name = "remarks", length = 500)
    private String remarks;

    /**
     * 字段列表
     */
    @OneToMany(mappedBy = "tableSchema", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ColumnSchema> columns;
}
