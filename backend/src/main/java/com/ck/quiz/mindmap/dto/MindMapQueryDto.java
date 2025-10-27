package com.ck.quiz.mindmap.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 思维导图查询 DTO
 * 用于查询思维导图时的条件过滤和分页参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MindMapQueryDto {

    /**
     * 导图名称（模糊查询）
     */
    private String mapName;

    /**
     * 页码（从0开始）
     */
    private int pageNum = 0;

    /**
     * 每页大小
     */
    private int pageSize = 20;

    /**
     * 排序字段
     */
    private String sortColumn = "create_date";

    /**
     * 排序方向（asc/desc）
     */
    private String sortType = "desc";
}