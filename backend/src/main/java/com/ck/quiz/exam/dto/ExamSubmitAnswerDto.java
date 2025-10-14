package com.ck.quiz.exam.dto;

import lombok.Data;

import java.util.List;

@Data
public class ExamSubmitAnswerDto {
    private String examQuestionId;
    private List<String> answers; // 用户作答，按题型：SINGLE/MULTIPLE/BLANK 为选项或填空，SHORT_ANSWER 为单元素文本
}