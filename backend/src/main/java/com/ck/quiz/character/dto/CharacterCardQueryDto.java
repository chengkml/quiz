package com.ck.quiz.character.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 生字卡片查询 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class CharacterCardQueryDto extends QueryDto {
    private String keyword;
    private Boolean archived;
    private Integer minRepetition;
    private Integer maxRepetition;
    private LocalDate createDateStart;
    private LocalDate createDateEnd;
    private Integer page = 0;
    private Integer size = 20;
    private String sortBy = "createDate";
    private String sortDirection = "desc";
}
