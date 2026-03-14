package com.ck.quiz.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 单词熟练度统计仪表盘数据
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VocabularyProficiencyDashboardDto {

    /**
     * 核心指标概览
     */
    private VocabularyProficiencyOverviewDto overview;

    /**
     * 熟练度分层分布
     */
    private Map<String, Long> proficiencyDistribution;

    /**
     * 复习评分分布（0-5 分）
     */
    private Map<String, Long> reviewScoreDistribution;

    /**
     * 近七天复习次数趋势（按日期）
     */
    private Map<String, Long> reviewCountByLastSevenDays;
}
