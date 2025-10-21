package com.ck.quiz.llmmodel.dto;

import com.ck.quiz.llmmodel.entity.LLMModel;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 大语言模型更新 DTO
 * 用于接收更新模型的请求参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LLMModelUpdateDto {

    /**
     * 模型唯一标识
     */
    @NotBlank(message = "模型ID不能为空")
    private String id;

    /**
     * 模型名称
     */
    private String name;

    /**
     * 模型描述
     */
    private String description;

    /**
     * API 密钥
     */
    private String apiKey;

    /**
     * API 端点
     */
    private String apiEndpoint;

    /**
     * 上下文窗口大小
     */
    private Integer contextWindow;

    /**
     * 输入token单价（分/千token）
     */
    private Double inputPricePer1k;

    /**
     * 输出token单价（分/千token）
     */
    private Double outputPricePer1k;

    /**
     * 是否为默认模型
     */
    private Boolean isDefault;

    /**
     * 模型状态
     */
    private LLMModel.ModelStatus status;

    /**
     * 配置信息（JSON格式）
     */
    private String config;
}