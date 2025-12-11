package com.ck.quiz.utils;

import lombok.Data;

@Data
public class ScoreRule {
    /**
     * 规则类型
     */
    private String type;
    /**
     * 占比
     */
    private int weight;

    /**
     * 计算阈值
     */
    private int threshold;

    /**
     * 扣减分值
     */
    private int deduct;
}
