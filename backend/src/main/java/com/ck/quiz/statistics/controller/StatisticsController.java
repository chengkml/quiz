package com.ck.quiz.statistics.controller;

import com.ck.quiz.statistics.dto.StatisticsDto;
import com.ck.quiz.statistics.dto.StatisticsThemeDto;
import com.ck.quiz.statistics.service.StatisticsService;
import com.ck.quiz.statistics.service.StatisticsThemeRegistry;
import com.ck.quiz.statistics.service.StatisticsThemeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * 统计信息控制器
 */
@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;
    private final StatisticsThemeRegistry statisticsThemeRegistry;

    public StatisticsController(StatisticsService statisticsService,
            StatisticsThemeRegistry statisticsThemeRegistry) {
        this.statisticsService = statisticsService;
        this.statisticsThemeRegistry = statisticsThemeRegistry;
    }

    /**
     * 获取统计概览（兼容旧接口）
     */
    @GetMapping
    public ResponseEntity<StatisticsDto> getStatistics() {
        StatisticsDto statistics = statisticsService.getStatistics();
        return ResponseEntity.ok(statistics);
    }

    /**
     * 获取统计主题列表
     */
    @GetMapping("/themes")
    public ResponseEntity<List<StatisticsThemeDto>> getThemes() {
        return ResponseEntity.ok(statisticsThemeRegistry.listThemes());
    }

    /**
     * 获取指定主题仪表盘
     */
    @GetMapping("/themes/{themeKey}/dashboard")
    public ResponseEntity<Object> getThemeDashboard(@PathVariable String themeKey) {
        StatisticsThemeService themeService = statisticsThemeRegistry.getThemeService(themeKey)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "统计主题不存在: " + themeKey));
        return ResponseEntity.ok(themeService.getDashboard());
    }
}
