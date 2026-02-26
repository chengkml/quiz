package com.ck.quiz.vocabulary.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.List;

/**
 * 单词卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class VocabularyCardDto extends Dto {
    private String word;
    private String mdDefinition;
    private Double easinessFactor;
    private Integer interval;
    private Integer repetition;
    private LocalDate nextReviewDate;
    private Boolean archived;
    private List<String> tags;  // 单词本特有的tags字段（List形式，从实体的逗号分隔字符串转换而来）
    private Integer totalReviewCount;
    private Integer lastScore;
}
