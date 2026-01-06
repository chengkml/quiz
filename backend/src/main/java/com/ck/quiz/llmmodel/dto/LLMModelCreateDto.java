package com.ck.quiz.llmmodel.dto;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class LLMModelCreateDto extends CreateDto {

    @NotBlank(message = "模型名称不能为空")
    private String name;

    @NotBlank(message = "模型提供商不能为空")
    private String provider;

    @NotNull(message = "模型类型不能为空")
    private LLMModel.ModelType type;

    private String descr;

    @NotBlank(message = "API密钥不能为空")
    private String apiKey;

    @NotBlank(message = "API端点不能为空")
    private String apiEndpoint;

    private Integer contextWindow;

    @NotNull(message = "输入token单价不能为空")
    private Double inputPricePer1k;

    @NotNull(message = "输出token单价不能为空")
    private Double outputPricePer1k;

    private String config;
}