package com.ck.quiz.question.dto;

import lombok.Data;

@Data
public class QuestionGenerateDto {

    private String knowledgeDescr;
    private String knowledgeTitle;
    private String knowledgeContent;
    private int num = 3;
    private String modelName;
}
