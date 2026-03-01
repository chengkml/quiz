package com.ck.quiz.poetry.dto;

import com.ck.quiz.base.dto.UpdateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 更新诗词卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class PoetryCardUpdateDto extends UpdateDto {
    private String title;
    private String author;
    private String dynasty;
    private String content;
    private String mdAnalysis;
}
