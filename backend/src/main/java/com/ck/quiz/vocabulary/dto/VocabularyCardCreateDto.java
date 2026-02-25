package com.ck.quiz.vocabulary.dto;

import lombok.Data;

import java.time.LocalDate;

/**
 * 创建单词卡片 DTO
 */
@Data
public class VocabularyCardCreateDto {
    private String word;
    private String mdDefinition;
    private String tags;
    private LocalDate studiedDate;
}
