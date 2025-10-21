package com.ck.quiz.llmmodel.dto;

import com.ck.quiz.llmmodel.entity.LLMModel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 大语言模型查询 DTO
 * 用于接收查询模型的请求参数
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LLMModelQueryDto {

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
     * 模型状态
     */
    private LLMModel.ModelStatus status;

    /**
     * 是否为默认模型
     */
    private Boolean isDefault;

    /**
     * 页码
     */
    private Integer pageNum = 0;

    /**
     * 每页大小
     */
    private Integer pageSize = 20;

    /**
     * 排序字段
     */
    private String sortColumn = "create_date";

    /**
     * 排序方向
     */
    private String sortType = "desc";
}