package com.ck.quiz.statistics.service;

import com.ck.quiz.statistics.dto.KnowledgeMasteryDashboardDto;
import com.ck.quiz.statistics.dto.KnowledgeMasteryOverviewDto;

import java.util.Map;

/**
 * 知识掌握统计服务
 */
public interface KnowledgeMasteryStatisticsService {

    /**
     * 获取知识掌握统计概览
     */
    KnowledgeMasteryOverviewDto getOverview();

    /**
     * 获取知识掌握分层分布
     */
    Map<String, Long> getMasteryDistribution();

    /**
     * 获取学科知识点分布
     */
    Map<String, Long> getKnowledgeCountBySubject();

    /**
     * 获取复习评分分布
     */
    Map<String, Long> getReviewScoreDistribution();

    /**
     * 获取近七天复习次数
     */
    Map<String, Long> getReviewCountByLastSevenDays();

    /**
     * 获取知识掌握统计仪表盘
     */
    KnowledgeMasteryDashboardDto getDashboard();
}
