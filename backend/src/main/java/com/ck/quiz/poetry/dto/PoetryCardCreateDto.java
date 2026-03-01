package com.ck.quiz.poetry.dto;

import com.ck.quiz.base.dto.CreateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 创建诗词卡片 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class PoetryCardCreateDto extends CreateDto {
    private String title;
    private String author;
    private String dynasty;
    private String content;
    private String mdAnalysis;
}
