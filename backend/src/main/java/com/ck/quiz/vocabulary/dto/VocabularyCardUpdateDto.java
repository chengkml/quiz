package com.ck.quiz.vocabulary.dto;

import com.ck.quiz.base.dto.UpdateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;


/**
 * 更新单词卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class VocabularyCardUpdateDto extends UpdateDto {
    private String word;
    private String mdDefinition;
}
