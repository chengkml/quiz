package com.ck.quiz.vocabulary.dto;

import lombok.Data;

/**
 * 单词释义生成 DTO
 */
@Data
public class VocabularyDefinitionGenerateDto {
    private String word;
    private String mdDefinition;
}
