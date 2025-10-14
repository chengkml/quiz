package com.ck.quiz.exam.dto;

import lombok.Data;

import java.util.List;

@Data
public class ExamSubmitDto {
    private String userId; // 当前答题用户ID
    private List<ExamSubmitAnswerDto> answerList;
}