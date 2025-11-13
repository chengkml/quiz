package com.ck.quiz.datasource.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 数据表字段结构实体
 * 用于存储数据库表中每个字段的定义信息
 */
@Entity
@Table(
        name = "column_schema",
        indexes = {
                @Index(name = "idx_column_schema_table_id", columnList = "table_id"),
                @Index(name = "idx_column_schema_name", columnList = "column_name")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ColumnSchema {

    @Id
    @Column(name = "column_id", length = 32, nullable = false)
    private String id;

    /**
     * 所属表
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private TableSchema tableSchema;

    /**
     * 字段名称
     */
    @Column(name = "column_name", length = 200, nullable = false)
    private String columnName;

    /**
     * 数据类型
     */
    @Column(name = "data_type", length = 100)
    private String dataType;

    /**
     * 字段长度
     */
    @Column(name = "column_size")
    private Integer columnSize;

    /**
     * 小数位数
     */
    @Column(name = "decimal_digits")
    private Integer decimalDigits;

    /**
     * 是否可为空
     */
    @Column(name = "nullable")
    private Boolean nullable;

    /**
     * 默认值
     */
    @Column(name = "default_value", length = 200)
    private String defaultValue;

    /**
     * 是否主键
     */
    @Column(name = "primary_key")
    private Boolean primaryKey;

    /**
     * 字段注释
     */
    @Column(name = "remarks", length = 500)
    private String remarks;
}
