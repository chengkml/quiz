package com.ck.quiz.poetry.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 诗词卡片查询 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class PoetryCardQueryDto extends QueryDto {
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
