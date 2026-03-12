package com.ck.quiz.character.dto;

import com.ck.quiz.base.dto.CreateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 创建生字卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CharacterCardCreateDto extends CreateDto {
    private String characterText;
    private String pinyin;
    private String mdDefinition;
}
