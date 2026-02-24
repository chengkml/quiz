package com.ck.quiz.vocabulary.dto;

import lombok.Data;

import java.util.Map;

/**
 * 学习统计 DTO
 */
@Data
public class StatisticsDto {
    private Long totalWords; // 总单词数
    private Long dueToday; // 今日待复习
    private Long archived; // 已归档
    private Map<String, Long> repetitionDistribution; // 熟练度分布
    private Map<String, Long> efDistribution; // 简易度分布
}
