package com.ck.quiz.prompt.dto;

import com.ck.quiz.base.dto.UpdateDto;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PromptTemplateUpdateDto extends UpdateDto {

    @Size(max = 255, message = "模板名称长度不能超过255个字符")
    private String name;

    private String content;

    @Size(max = 500, message = "模板描述长度不能超过500个字符")
    private String description;
}