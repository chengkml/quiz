package com.ck.quiz.statistics.service;

import com.ck.quiz.statistics.dto.VocabularyProficiencyDashboardDto;
import com.ck.quiz.statistics.dto.VocabularyProficiencyOverviewDto;

import java.util.Map;

/**
 * 单词熟练度统计服务
 */
public interface VocabularyProficiencyStatisticsService {

    /**
     * 获取单词熟练度统计概览
     */
    VocabularyProficiencyOverviewDto getOverview();

    /**
     * 获取熟练度分层分布
     */
    Map<String, Long> getProficiencyDistribution();

    /**
     * 获取复习评分分布
     */
    Map<String, Long> getReviewScoreDistribution();

    /**
     * 获取近七天复习次数
     */
    Map<String, Long> getReviewCountByLastSevenDays();

    /**
     * 获取单词熟练度统计仪表盘
     */
    VocabularyProficiencyDashboardDto getDashboard();
}
