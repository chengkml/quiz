package com.ck.quiz.vocabulary.dto;

import com.ck.quiz.base.dto.ReviewDto;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 单词卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class VocabularyCardDto extends ReviewDto {
    private String word;
    private String mdDefinition;
}
