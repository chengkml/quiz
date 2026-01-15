package com.ck.quiz.chat.dto;

import lombok.Data;

@Data
public class ChatConfig {

    private String modelName;

    private Double temperature;

    private Integer maxTokens;
}

