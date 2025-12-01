package com.ck.quiz.question.dto;

import lombok.Data;

@Data
public class QuestionGenerateDto {

    private String knowledgeDescr;
    private int num = 3;
}
