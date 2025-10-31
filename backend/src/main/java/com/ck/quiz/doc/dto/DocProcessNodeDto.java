package com.ck.quiz.doc.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 文档流程节点DTO
 * 用于返回流程节点数据，包含关联的标题信息
 */
@Data
public class DocProcessNodeDto {

    private String id;
    private String docId;
    private String headingId; // 关联的5级标题ID
    private Integer sequenceNo;
    private String content;
    private LocalDateTime createDate;
    private String headingText; // 关联的标题文本
}