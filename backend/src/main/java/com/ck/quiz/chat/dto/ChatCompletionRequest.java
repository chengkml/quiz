package com.ck.quiz.chat.dto;

import lombok.Data;

@Data
public class ChatCompletionRequest {

    private String sessionId;

    private ChatMessagePayload message;

    private ChatConfig config;

    /**
     * ALL_ACCESSIBLE: 当前用户全部可访问知识集
     * KNOWLEDGE_SET: 指定单个知识集
     */
    private String knowledgeScopeType;

    private String knowledgeSetId; // 可选：指定知识集ID进行RAG检索
}
