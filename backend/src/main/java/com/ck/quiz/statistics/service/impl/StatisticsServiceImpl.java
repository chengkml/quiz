package com.ck.quiz.statistics.service.impl;

import com.ck.quiz.statistics.dto.StatisticsDto;
import com.ck.quiz.statistics.service.QuestionBankStatisticsService;
import com.ck.quiz.statistics.service.StatisticsService;
import org.springframework.stereotype.Service;

/**
 * 统计服务实现类（兼容旧接口，默认返回题库主题概览）
 */
@Service
public class StatisticsServiceImpl implements StatisticsService {

    private final QuestionBankStatisticsService questionBankStatisticsService;

    public StatisticsServiceImpl(QuestionBankStatisticsService questionBankStatisticsService) {
        this.questionBankStatisticsService = questionBankStatisticsService;
    }

    @Override
    public StatisticsDto getStatistics() {
        return questionBankStatisticsService.getOverview();
    }
}
