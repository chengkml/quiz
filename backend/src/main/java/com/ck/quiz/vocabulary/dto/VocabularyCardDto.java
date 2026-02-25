package com.ck.quiz.vocabulary.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 单词卡片 DTO
 */
@Data
public class VocabularyCardDto {
    private String id;
    private String word;
    private String mdDefinition;
    private Double easinessFactor;
    private Integer interval;
    private Integer repetition;
    private LocalDate nextReviewDate;
    private Boolean archived;
    private String tags;
    private Integer totalReviewCount;
    private Integer lastScore;
    private LocalDate studiedDate;
    private LocalDateTime createDate;
    private LocalDateTime updateDate;
    private String createUser;
}
