package com.ck.quiz.exam.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExamResultDetailDto {
    private String resultId;
    private String examId;
    private String userId;
    private int totalScore;
    private int correctCount;
    private LocalDateTime submitTime;
    private List<ExamResultDetailAnswerDto> answers;
}