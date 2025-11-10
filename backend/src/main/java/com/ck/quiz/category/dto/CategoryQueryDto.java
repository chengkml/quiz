package com.ck.quiz.category.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 分类查询DTO
 * 用于分类查询时接收查询参数
 */
@Data
@NoArgsConstructor
public class CategoryQueryDto {

    /**
     * 分类名称（模糊查询）
     */
    private String name;

    /**
     * 父分类ID
     */
    private String parentId;

    /**
     * 所属学科ID
     */
    private String subjectId;



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