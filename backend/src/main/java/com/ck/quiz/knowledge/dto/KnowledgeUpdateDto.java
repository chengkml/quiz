package com.ck.quiz.knowledge.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 知识点更新DTO
 * 用于更新现有知识点时接收参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeUpdateDto {

    /**
     * 知识点唯一标识
     */
    @NotBlank(message = "知识点ID不能为空")
    @Size(max = 32, message = "知识点ID长度不能超过32个字符")
    private String id;

    /**
     * 知识点名称
     */
    @NotBlank(message = "知识点名称不能为空")
    private String name;

    /**
     * 所属分类ID
     */
    @NotBlank(message = "所属分类ID不能为空")
    @Size(max = 32, message = "分类ID长度不能超过32个字符")
    private String categoryId;

    /**
     * 所属学科ID
     */
    @NotBlank(message = "所属学科ID不能为空")
    @Size(max = 32, message = "学科ID长度不能超过32个字符")
    private String subjectId;

    /**
     * 知识点内容(HTML)
     */
    private String content;

}