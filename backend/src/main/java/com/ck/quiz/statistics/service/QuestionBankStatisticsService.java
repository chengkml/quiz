package com.ck.quiz.statistics.service;

import com.ck.quiz.statistics.dto.QuestionBankDashboardDto;
import com.ck.quiz.statistics.dto.StatisticsDto;

import java.util.Map;

/**
 * 题库统计服务
 */
public interface QuestionBankStatisticsService {

    /**
     * 获取题库统计概览
     */
    StatisticsDto getOverview();

    /**
     * 获取近七天题目增加量
     */
    Map<String, Long> getQuestionCountByLastSevenDays();

    /**
     * 获取各学科题目数量
     */
    Map<String, Long> getQuestionCountBySubject();

    /**
     * 获取近一个月题目增加量
     */
    Map<String, Long> getQuestionCountByLastMonth();

    /**
     * 获取题库统计仪表盘
     */
    QuestionBankDashboardDto getDashboard();
}
