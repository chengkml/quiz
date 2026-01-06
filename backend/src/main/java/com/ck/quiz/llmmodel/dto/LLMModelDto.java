package com.ck.quiz.llmmodel.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.llmmodel.entity.LLMModel;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class LLMModelDto extends Dto {

    private String name;
    private String provider;
    private LLMModel.ModelType type;
    private String descr;
    private String apiKey;
    private String apiEndpoint;
    private Integer contextWindow;
    private Double inputPricePer1k;
    private Double outputPricePer1k;
    private String isDefault;
    private String config;
}