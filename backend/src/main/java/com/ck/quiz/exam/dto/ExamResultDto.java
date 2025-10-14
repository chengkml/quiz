package com.ck.quiz.exam.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class ExamResultDto {
    private String resultId;
    private String examId;
    private String userId;
    private int totalScore;
    private int correctCount;
    private LocalDateTime submitTime;
    private List<ExamResultAnswerDto> answers;
}