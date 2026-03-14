package com.ck.quiz.statistics.service;

import com.ck.quiz.statistics.dto.StatisticsThemeDto;

/**
 * 统计主题服务
 */
public interface StatisticsThemeService {

    /**
     * 主题唯一标识
     */
    String getThemeKey();

    /**
     * 主题定义
     */
    StatisticsThemeDto getTheme();

    /**
     * 主题仪表盘数据
     */
    Object getDashboard();
}
