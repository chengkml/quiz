package com.ck.quiz.prompt.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PromptTemplateCreateDto extends CreateDto {

    @NotBlank(message = "模板名称不能为空")
    @Size(max = 255, message = "模板名称长度不能超过255个字符")
    private String name;

    @NotBlank(message = "模板内容不能为空")
    private String content;

    @Size(max = 500, message = "模板描述长度不能超过500个字符")
    private String description;
}