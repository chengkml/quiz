package com.ck.quiz.prompt.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class PromptTemplateDto extends Dto {

    private String name;

    private String content;

    private String description;
}