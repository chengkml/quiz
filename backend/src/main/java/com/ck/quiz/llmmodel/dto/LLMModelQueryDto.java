package com.ck.quiz.llmmodel.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.llmmodel.entity.LLMModel;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class LLMModelQueryDto extends QueryDto {

    private String name;
    private String provider;
    private LLMModel.ModelType type;
    private String isDefault;
}