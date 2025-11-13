package com.ck.quiz.datasource.repository;

import com.ck.quiz.datasource.entity.ColumnSchema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * 字段结构仓库接口
 * 用于操作 column_schema 表
 */
public interface ColumnSchemaRepository extends JpaRepository<ColumnSchema, String> {

    /**
     * 根据表名查询字段结构信息
     *
     * @param tableName 表名
     * @return 该表的字段列表
     */
    @Query("SELECT c FROM ColumnSchema c WHERE c.tableSchema.tableName = :tableName ")
    List<ColumnSchema> findColumnsByTableName(@Param("tableName") String tableName);

    /**
     * 批量保存字段信息（用于更新备注等）
     *
     * @param columns 字段列表
     */
    default void saveAllColumns(List<ColumnSchema> columns) {
        if (columns != null && !columns.isEmpty()) {
            saveAll(columns);
        }
    }
}
