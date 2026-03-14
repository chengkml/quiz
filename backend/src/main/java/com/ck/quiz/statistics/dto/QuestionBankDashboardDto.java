package com.ck.quiz.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 题库统计仪表盘数据
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class QuestionBankDashboardDto {

    /**
     * 核心指标概览
     */
    private StatisticsDto overview;

    /**
     * 近七天新增题目数（按日期）
     */
    private Map<String, Long> questionCountByLastSevenDays;

    /**
     * 各学科题目数
     */
    private Map<String, Long> questionCountBySubject;

    /**
     * 近一个月新增题目数（按日期）
     */
    private Map<String, Long> questionCountByLastMonth;
}
