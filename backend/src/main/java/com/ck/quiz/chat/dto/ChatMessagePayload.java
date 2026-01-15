package com.ck.quiz.chat.dto;

import lombok.Data;

@Data
public class ChatMessagePayload {

    private String role;

    private String content;
}

