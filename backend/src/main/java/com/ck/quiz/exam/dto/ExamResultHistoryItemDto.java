package com.ck.quiz.exam.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ExamResultHistoryItemDto {
    private String resultId;
    private String examId;
    private String examName;
    private Integer totalScore;
    private Integer userScore;
    private Integer correctCount;
    private LocalDateTime submitTime;
}