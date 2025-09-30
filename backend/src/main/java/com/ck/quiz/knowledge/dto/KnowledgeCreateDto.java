package com.ck.quiz.knowledge.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 知识点创建DTO
 * 用于创建新知识点时接收参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeCreateDto {

    /**
     * 知识点名称
     */
    @NotBlank(message = "知识点名称不能为空")
    @Size(max = 64, message = "知识点名称长度不能超过64个字符")
    private String name;

    /**
     * 知识点描述
     */
    @Size(max = 255, message = "知识点描述长度不能超过255个字符")
    private String description;

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
     * 难度等级（1-5）
     */
    @Min(value = 1, message = "难度等级最小值为1")
    @Max(value = 5, message = "难度等级最大值为5")
    private Integer difficultyLevel;

}