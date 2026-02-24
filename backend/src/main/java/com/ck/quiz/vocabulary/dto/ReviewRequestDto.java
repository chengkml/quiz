package com.ck.quiz.vocabulary.dto;

import lombok.Data;

/**
 * 复习请求 DTO
 */
@Data
public class ReviewRequestDto {
    private String cardId;
    private Integer score; // 0-5
}
