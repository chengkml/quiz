package com.ck.quiz.subject.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 学科创建DTO
 * 用于创建新学科时接收参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubjectCreateDto {

    /**
     * 学科名称
     */
    @NotBlank(message = "学科名称不能为空")
    @Size(max = 64, message = "学科名称长度不能超过64个字符")
    private String name;

    /**
     * 学科描述
     */
    @Size(max = 255, message = "学科描述长度不能超过255个字符")
    private String description;

}