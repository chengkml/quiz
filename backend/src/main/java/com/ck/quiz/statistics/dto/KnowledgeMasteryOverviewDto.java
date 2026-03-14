package com.ck.quiz.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 知识掌握统计概览
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeMasteryOverviewDto {

    /**
     * 知识点总数
     */
    private Long totalKnowledges;

    /**
     * 活跃知识点数（未归档）
     */
    private Long activeKnowledges;

    /**
     * 已归档知识点数
     */
    private Long archivedKnowledges;

    /**
     * 已掌握知识点数（连续记对 >= 6）
     */
    private Long masteredKnowledges;

    /**
     * 今日待复习知识点数
     */
    private Long dueTodayKnowledges;

    /**
     * 平均连续记对次数（仅统计未归档）
     */
    private Double averageRepetition;

    /**
     * 平均简易度因子（仅统计未归档）
     */
    private Double averageEasinessFactor;
}
