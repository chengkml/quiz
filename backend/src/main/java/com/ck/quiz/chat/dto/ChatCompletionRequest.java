package com.ck.quiz.chat.dto;

import lombok.Data;

@Data
public class ChatCompletionRequest {

    private String sessionId;

    private ChatMessagePayload message;

    private ChatConfig config;
}

