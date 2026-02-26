package com.ck.quiz.base.dto;

import java.time.LocalDateTime;

import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class ReviewDto extends Dto {

    /**
     * 简易度因子
     */
    private Double easinessFactor;

    /**
     * 复习间隔天数
     */
    private Integer interval;

    /**
     * 连续记对次数
     */
    private Integer repetition;

    /**
     * 下次复习时间
     */
    private LocalDateTime nextReviewDate;

    /**
     * 是否已归档
     */
    private Boolean archived;

    /**
     * 总复习次数
     */
    private Integer totalReviewCount;

    /**
     * 最后一次评分
     */
    private Integer lastScore;
    
}
