package com.ck.quiz.chat.dto;

import lombok.Data;

@Data
public class ChatMessageDto {

    private String id;

    private String role;

    private String content;

    private String createdAt;

    private java.util.List<ChatReferenceDto> references;
}
