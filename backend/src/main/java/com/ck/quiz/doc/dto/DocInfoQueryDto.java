package com.ck.quiz.doc.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文档查询 DTO
 * 用于查询文档信息时的条件参数
 */
@Data
public class DocInfoQueryDto {

    /**
     * 文档唯一标识
     */
    private String id;

    /**
     * 文件名（支持模糊查询）
     */
    private String fileName;

    /**
     * 上传用户
     */
    private String uploadUser;

    /**
     * 页码（从1开始）
     */
    private Integer pageNum = 1;

    /**
     * 每页大小
     */
    private Integer pageSize = 10;
}