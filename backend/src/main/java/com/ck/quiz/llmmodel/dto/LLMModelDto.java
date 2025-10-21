package com.ck.quiz.llmmodel.dto;

import com.ck.quiz.llmmodel.entity.LLMModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 大语言模型 DTO（Data Transfer Object）
 * 用于在服务层与前端或其他系统交互时传输模型详细信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LLMModelDto {

    /**
     * 模型唯一标识
     */
    private String id;

    /**
     * 模型名称
     */
    private String name;

    /**
     * 模型提供商
     */
    private String provider;

    /**
     * 模型类型
     */
    private LLMModel.ModelType type;

    /**
     * 模型描述
     */
    private String description;

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

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    private String createUser;

    /**
     * 创建人中文名
     */
    private String createUserName;

    /**
     * 更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    private String updateUser;
}