package com.ck.quiz.doc.dto;

import lombok.Data;

import jakarta.validation.constraints.Min;

/**
 * 文档流程节点查询DTO
 */
@Data
public class DocProcessNodeQueryDto {

    /**
     * 文档ID
     */
    private String docId;

    /**
     * 页码，默认值为1
     */
    @Min(value = 0, message = "页码必须大于等于0")
    private Integer pageNum = 0;

    /**
     * 每页大小，默认值为20
     */
    @Min(value = 1, message = "每页大小必须大于等于1")
    private Integer pageSize = 20;

    /**
     * 搜索关键词
     */
    private String keyWord;

    /**
     * 标题ID
     */
    private String headingId;
}