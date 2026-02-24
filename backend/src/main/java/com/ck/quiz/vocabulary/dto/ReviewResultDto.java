package com.ck.quiz.vocabulary.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * 复习结果 DTO
 */
@Data
public class ReviewResultDto {
    private String cardId;
    private String word;
    private Integer score;
    private Double newEasinessFactor;
    private Integer newInterval;
    private Integer newRepetition;
    private LocalDate nextReviewDate;
    private String message;
}
