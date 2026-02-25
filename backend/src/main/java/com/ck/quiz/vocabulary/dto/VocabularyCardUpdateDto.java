package com.ck.quiz.vocabulary.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * 更新单词卡片 DTO
 */
@Data
public class VocabularyCardUpdateDto {
    private String id;
    private String word;
    private String mdDefinition;
    private String tags;
    private LocalDate studiedDate;
}
