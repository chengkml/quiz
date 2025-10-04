package com.ck.quiz.exam.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 试卷题目创建 DTO
 * 用于创建试卷时指定题目信息
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestionCreateDto {

    /**
     * 题目ID
     */
    @NotBlank(message = "题目ID不能为空")
    private String questionId;

    /**
     * 题目顺序
     */
    @NotNull(message = "题目顺序不能为空")
    @Positive(message = "题目顺序必须为正数")
    private Integer orderNo;

    /**
     * 分值
     */
    @NotNull(message = "分值不能为空")
    @Positive(message = "分值必须为正数")
    private Integer score;
}