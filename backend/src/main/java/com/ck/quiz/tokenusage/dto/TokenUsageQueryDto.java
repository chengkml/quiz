package com.ck.quiz.tokenusage.dto;

import lombok.Data;

@Data
public class TokenUsageQueryDto {

    /**
     * 开始日期（格式：yyyy-MM-dd）
     */
    private String startDate;

    /**
     * 结束日期（格式：yyyy-MM-dd）
     */
    private String endDate;

    /**
     * 用户ID
     */
    private String userId;

    /**
     * 模型名称
     */
    private String modelName;

    /**
     * 业务类型
     */
    private String businessType;

    /**
     * 统计类型：model-按模型统计, business-按业务类型统计, user-按用户统计, date-按日期统计
     */
    private String statType = "model";
}
