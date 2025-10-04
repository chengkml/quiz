package com.ck.quiz.exam.dto;

import com.ck.quiz.question.dto.QuestionDto;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 试卷题目关系 DTO
 * 用于传输试卷中题目的详细信息，包括顺序和分值
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestionDto {

    /**
     * 关系ID
     */
    private String id;

    /**
     * 题目信息
     */
    private QuestionDto question;

    /**
     * 题目顺序
     */
    private Integer orderNo;

    /**
     * 分值
     */
    private Integer score;
}