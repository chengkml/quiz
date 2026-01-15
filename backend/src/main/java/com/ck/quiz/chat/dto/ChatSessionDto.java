package com.ck.quiz.chat.dto;

import lombok.Data;

@Data
public class ChatSessionDto {

    private String sessionId;

    private String title;

    private String modelName;

    private String updatedAt;
}

