package com.ck.quiz.vocabulary.dto;

import com.ck.quiz.base.dto.CreateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 创建单词卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class VocabularyCardCreateDto extends CreateDto {
    private String word;
    private String mdDefinition;
    private LocalDate studiedDate;
}
