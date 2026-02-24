package com.ck.quiz.vocabulary.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 复习记录 DTO
 */
@Data
public class ReviewLogDto {
    private String id;
    private String vocabularyCardId;
    private LocalDateTime reviewDate;
    private Integer score;
    private Double efBefore;
    private Double efAfter;
    private Integer nextIntervalDays;
}
