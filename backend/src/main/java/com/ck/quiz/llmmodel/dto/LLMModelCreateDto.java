package com.ck.quiz.llmmodel.dto;

import com.ck.quiz.llmmodel.entity.LLMModel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 大语言模型创建 DTO
 * 用于接收创建模型的请求参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LLMModelCreateDto {

    /**
     * 模型名称
     */
    @NotBlank(message = "模型名称不能为空")
    private String name;

    /**
     * 模型提供商
     */
    @NotBlank(message = "模型提供商不能为空")
    private String provider;

    /**
     * 模型类型
     */
    @NotNull(message = "模型类型不能为空")
    private LLMModel.ModelType type;

    /**
     * 模型描述
     */
    private String description;

    /**
     * API 密钥
     */
    @NotBlank(message = "API 密钥不能为空")
    private String apiKey;

    /**
     * API 端点
     */
    @NotBlank(message = "API 端点不能为空")
    private String apiEndpoint;

    /**
     * 上下文窗口大小
     */
    private Integer contextWindow;

    /**
     * 输入token单价（分/千token）
     */
    @NotNull(message = "输入token单价不能为空")
    private Double inputPricePer1k;

    /**
     * 输出token单价（分/千token）
     */
    @NotNull(message = "输出token单价不能为空")
    private Double outputPricePer1k;

    /**
     * 是否为默认模型
     */
    private Boolean isDefault = false;

    /**
     * 配置信息（JSON格式）
     */
    private String config;
}