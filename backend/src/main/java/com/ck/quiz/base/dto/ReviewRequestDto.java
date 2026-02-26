package com.ck.quiz.base.dto;

import lombok.Data;

/**
 * 复习请求 DTO
 */
@Data
public class ReviewRequestDto {
    private String id;
    private Integer score; // 0-5
}
