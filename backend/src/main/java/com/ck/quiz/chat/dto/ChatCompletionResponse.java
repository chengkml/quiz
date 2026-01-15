package com.ck.quiz.chat.dto;

import lombok.Data;

import java.util.List;

@Data
public class ChatCompletionResponse {

    private String sessionId;

    private List<ChatMessageDto> messages;

    private ChatUsageDto usage;
}

