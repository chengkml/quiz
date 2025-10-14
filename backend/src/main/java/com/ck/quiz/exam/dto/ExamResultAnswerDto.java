package com.ck.quiz.exam.dto;

import lombok.Data;

@Data
public class ExamResultAnswerDto {
    private String examQuestionId;
    private boolean correct;
    private int gainScore;
}