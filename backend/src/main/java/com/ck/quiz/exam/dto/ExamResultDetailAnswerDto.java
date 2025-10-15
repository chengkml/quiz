package com.ck.quiz.exam.dto;

import lombok.Data;

import java.util.List;

@Data
public class ExamResultDetailAnswerDto {
    private String examQuestionId;
    private boolean correct;
    private int score; // 得分（gainScore）
    private List<String> userAnswers;
    private List<String> standardAnswers;
}