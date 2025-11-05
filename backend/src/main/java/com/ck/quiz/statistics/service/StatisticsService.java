package com.ck.quiz.statistics.service;

import com.ck.quiz.statistics.dto.StatisticsDto;

/**
 * 统计服务接口
 */
public interface StatisticsService {

    /**
     * 获取统计信息
     * @return 统计信息数据传输对象
     */
    StatisticsDto getStatistics();
}