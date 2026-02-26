package com.ck.quiz.knowledge.dto;

import com.ck.quiz.base.dto.ReviewDto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

/**
 * 知识点信息 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输知识点详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class KnowledgeDto extends ReviewDto {

    /**
     * 知识点名称
     */
    private String name;

    /**
     * 所属分类ID
     */
    private String categoryId;

    /**
     * 所属分类名称
     */
    private String categoryName;

    /**
     * 所属学科ID
     */
    private String subjectId;

    /**
     * 所属学科名称
     */
    private String subjectName;

    /**
     * 知识点内容(HTML)
     */
    private String content;

}