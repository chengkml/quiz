package com.ck.quiz.vocabulary.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

/**
 * 单词卡片查询 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class VocabularyCardQueryDto extends QueryDto {
    private String keyword; // 模糊搜索单词
    private Boolean archived; // 是否归档
    private Integer minRepetition; // 最小复习次数（熟练度筛选）
    private Integer maxRepetition;
    private LocalDate createDateStart; // 按添加日期筛选
    private LocalDate createDateEnd;
    private Integer page = 0;
    private Integer size = 20;
    private String sortBy = "createDate";
    private String sortDirection = "desc";
}
