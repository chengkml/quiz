package com.ck.quiz.chat.dto;

import lombok.Data;

@Data
public class ChatCompletionRequest {

    private String sessionId;

    private ChatMessagePayload message;

    private ChatConfig config;

    private String knowledgeSetId; // 可选：指定知识集ID进行RAG检索
}

