package com.ck.quiz.base.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 复习结果 DTO
 */
@Data
public class ReviewResultDto {
    private String id;
    private Integer score;
    private Double newEasinessFactor;
    private Integer newInterval;
    private Integer newRepetition;
    private LocalDateTime nextReviewDate;
    private String message;
}
