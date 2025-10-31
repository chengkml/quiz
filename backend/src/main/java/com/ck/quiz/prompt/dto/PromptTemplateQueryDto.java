package com.ck.quiz.prompt.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 提示词模板查询DTO
 * 用于分页查询提示词模板时接收参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromptTemplateQueryDto {

    /**
     * 模板名称（模糊查询）
     */
    private String name;

    /**
     * 创建用户
     */
    private String createUser;

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
    private String sortBy = "createDate";

    /**
     * 排序方向（asc/desc）
     */
    private String sortOrder = "desc";
}