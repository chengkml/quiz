package com.ck.quiz.mermaids.dto;

import lombok.Data;
import java.util.List;

@Data
public class MermaidChatRequest {
    private String modelName;
    private String diagramData;
    private List<Message> messages;

    @Data
    public static class Message {
        private String role; // "user" or "assistant"
        private String content;
    }
}
