package com.ck.quiz.tokenusage.dto;

import lombok.Data;

@Data
public class TokenUsageStatDto {

    /**
     * 统计维度的值（可能是模型名、业务类型、用户ID、日期等）
     */
    private String dimension;

    /**
     * 总token数
     */
    private Long totalTokens;

    /**
     * 输入token数
     */
    private Long promptTokens;

    /**
     * 输出token数
     */
    private Long completionTokens;

    /**
     * 总成本
     */
    private Double totalCost;

    /**
     * 请求次数
     */
    private Long requestCount;

    public TokenUsageStatDto() {
    }

    public TokenUsageStatDto(String dimension, Long promptTokens, Long completionTokens, Long totalTokens, 
                            Double totalCost, Long requestCount) {
        this.dimension = dimension;
        this.promptTokens = promptTokens;
        this.completionTokens = completionTokens;
        this.totalTokens = totalTokens;
        this.totalCost = totalCost;
        this.requestCount = requestCount;
    }
}
