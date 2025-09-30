package com.ck.quiz.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 分类更新DTO
 * 用于更新现有分类时接收参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CategoryUpdateDto {

    /**
     * 分类唯一标识
     */
    @NotBlank(message = "分类ID不能为空")
    @Size(max = 32, message = "分类ID长度不能超过32个字符")
    private String id;

    /**
     * 分类名称
     */
    @NotBlank(message = "分类名称不能为空")
    @Size(max = 64, message = "分类名称长度不能超过64个字符")
    private String name;

    /**
     * 父分类ID（顶级分类为null）
     */
    @Size(max = 32, message = "父分类ID长度不能超过32个字符")
    private String parentId;

    /**
     * 所属学科ID
     */
    @NotBlank(message = "所属学科ID不能为空")
    @Size(max = 32, message = "学科ID长度不能超过32个字符")
    private String subjectId;

    /**
     * 分类层级（1=学科下一级，2=章节，3=知识点）
     */
    @NotNull(message = "分类层级不能为空")
    private Integer level;

    /**
     * 分类描述
     */
    @Size(max = 255, message = "分类描述长度不能超过255个字符")
    private String description;

}