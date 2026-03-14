package com.ck.quiz.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 单词熟练度统计概览
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyProficiencyOverviewDto {

    /**
     * 单词总数
     */
    private Long totalWords;

    /**
     * 活跃单词数（未归档）
     */
    private Long activeWords;

    /**
     * 已归档单词数
     */
    private Long archivedWords;

    /**
     * 已熟练单词数（连续记对 >= 6）
     */
    private Long masteredWords;

    /**
     * 今日待复习单词数
     */
    private Long dueTodayWords;

    /**
     * 平均连续记对次数（仅统计未归档）
     */
    private Double averageRepetition;

    /**
     * 平均简易度因子（仅统计未归档）
     */
    private Double averageEasinessFactor;
}
