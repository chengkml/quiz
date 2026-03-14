package com.ck.quiz.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 知识掌握统计仪表盘数据
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeMasteryDashboardDto {

    /**
     * 核心指标概览
     */
    private KnowledgeMasteryOverviewDto overview;

    /**
     * 知识掌握分层分布
     */
    private Map<String, Long> masteryDistribution;

    /**
     * 学科知识点数量分布
     */
    private Map<String, Long> knowledgeCountBySubject;

    /**
     * 复习评分分布（0-5 分）
     */
    private Map<String, Long> reviewScoreDistribution;

    /**
     * 近七天复习次数趋势（按日期）
     */
    private Map<String, Long> reviewCountByLastSevenDays;
}
