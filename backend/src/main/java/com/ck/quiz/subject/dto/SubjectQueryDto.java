package com.ck.quiz.subject.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 学科查询DTO
 * 用于学科查询时接收查询条件
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubjectQueryDto {

    /**
     * 学科名称（模糊查询）
     */
    private String name;

    /**
     * 页码（从0开始）
     */
    private Integer pageNum = 0;

    /**
     * 每页大小
     */
    private Integer pageSize = 20;

    /**
     * 排序字段
     */
    private String sortColumn = "createDate";

    /**
     * 排序方向：asc/desc
     */
    private String sortType = "desc";

}