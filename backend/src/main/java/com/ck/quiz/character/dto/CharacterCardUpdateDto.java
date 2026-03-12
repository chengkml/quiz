package com.ck.quiz.character.dto;

import com.ck.quiz.base.dto.UpdateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 更新生字卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CharacterCardUpdateDto extends UpdateDto {
    private String characterText;
    private String pinyin;
    private String mdDefinition;
}
