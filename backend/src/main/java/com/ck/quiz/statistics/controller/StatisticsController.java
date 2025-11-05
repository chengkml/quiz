package com.ck.quiz.statistics.controller;

import com.ck.quiz.statistics.dto.StatisticsDto;
import com.ck.quiz.statistics.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 统计信息控制器
 */
@RestController
@RequestMapping("/api/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    @Autowired
    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    /**
     * 获取统计信息
     * @return 统计信息响应
     */
    @GetMapping
    public ResponseEntity<StatisticsDto> getStatistics() {
        StatisticsDto statistics = statisticsService.getStatistics();
        return ResponseEntity.ok(statistics);
    }
}