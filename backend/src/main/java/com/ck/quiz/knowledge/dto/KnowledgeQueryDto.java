package com.ck.quiz.knowledge.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 知识点查询DTO
 * 用于知识点查询时接收查询参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeQueryDto {

    /**
     * 知识点名称（模糊查询）
     */
    private String knowledgeName;

    /**
     * 所属分类ID
     */
    private String categoryId;

    /**
     * 所属学科ID
     */
    private String subjectId;

    /**
     * 难度等级
     */
    private Integer difficultyLevel;

    /**
     * 页码（从1开始）
     */
    private Integer pageNum = 1;

    /**
     * 每页大小
     */
    private Integer pageSize = 10;

    /**
     * 排序字段
     */
    private String sortColumn = "create_date";

    /**
     * 排序类型（asc/desc）
     */
    private String sortType = "desc";

}