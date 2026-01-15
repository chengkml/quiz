package com.ck.quiz.chat.dto;

import lombok.Data;

@Data
public class ChatUsageDto {

    private Integer promptTokens;

    private Integer completionTokens;

    private Integer totalTokens;
}

