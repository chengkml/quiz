package com.ck.quiz.character.dto;

import com.ck.quiz.base.dto.ReviewDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 生字卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CharacterCardDto extends ReviewDto {
    private String characterText;
    private String pinyin;
    private String mdDefinition;
}
