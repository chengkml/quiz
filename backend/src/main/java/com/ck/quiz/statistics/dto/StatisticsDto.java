package com.ck.quiz.statistics.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 统计信息数据传输对象
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsDto {

    /**
     * 待办数（待处理和进行中的待办总数）
     */
    private Long todoCount;

    /**
     * 学科数
     */
    private Long subjectCount;

    /**
     * 题目数
     */
    private Long questionCount;

    /**
     * 昨日题目增加量
     */
    private Long yesterdayQuestionCount;
}