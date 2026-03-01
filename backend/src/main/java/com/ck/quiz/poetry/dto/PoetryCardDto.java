package com.ck.quiz.poetry.dto;

import com.ck.quiz.base.dto.ReviewDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 诗词卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class PoetryCardDto extends ReviewDto {
    private String title;
    private String author;
    private String dynasty;
    private String content;
    private String mdAnalysis;
}
