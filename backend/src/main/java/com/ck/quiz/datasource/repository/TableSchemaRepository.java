package com.ck.quiz.datasource.repository;

import com.ck.quiz.datasource.entity.ColumnSchema;
import com.ck.quiz.datasource.entity.TableSchema;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * 表结构仓库接口
 * 用于操作 table_schema 表
 */
public interface TableSchemaRepository extends JpaRepository<TableSchema, String> {

    /**
     * 按 schema 删除旧的表结构数据
     * 通常用于重新采集指定 schema 的结构时清理旧数据
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM TableSchema t WHERE t.tableSchem = ?1")
    void deleteByTableSchem(String tableSchem);

    /**
     * 根据表名查询表结构信息
     *
     * @param tableName 表名
     * @return 表结构信息
     */
    @Query("SELECT t FROM TableSchema t WHERE t.tableName = :tableName")
    Optional<TableSchema> findByTableName(@Param("tableName") String tableName);

    /**
     * 根据 schema 查询表集合
     *
     * @param tableSchem schema 名称
     * @return 表列表
     */
    List<TableSchema> findByTableSchem(String tableSchem);

}
