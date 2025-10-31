package com.ck.quiz.prompt.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 提示词模板创建DTO
 * 用于创建新提示词模板时接收参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PromptTemplateCreateDto {

    /**
     * 模板名称
     */
    @NotBlank(message = "模板名称不能为空")
    @Size(max = 255, message = "模板名称长度不能超过255个字符")
    private String name;

    /**
     * 模板内容
     */
    @NotBlank(message = "模板内容不能为空")
    private String content;

    /**
     * 模板描述
     */
    @Size(max = 500, message = "模板描述长度不能超过500个字符")
    private String description;
}