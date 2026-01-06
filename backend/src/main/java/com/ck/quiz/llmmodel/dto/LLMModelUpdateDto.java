package com.ck.quiz.llmmodel.dto;

import com.ck.quiz.base.dto.UpdateDto;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class LLMModelUpdateDto extends UpdateDto {

    private String name;
    private String descr;
    private String apiKey;
    private String apiEndpoint;
    private Integer contextWindow;
    private Double inputPricePer1k;
    private Double outputPricePer1k;
    private String config;
}