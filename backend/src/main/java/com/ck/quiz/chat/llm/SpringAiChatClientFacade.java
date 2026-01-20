package com.ck.quiz.chat.llm;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class SpringAiChatClientFacade {

    private final ChatClient chatClient;

    public SpringAiChatClientFacade(ChatClient.Builder builder) {
        this.chatClient = builder.build();
    }

    public String chat(String content) {
        return chatClient.prompt().user(content).call().content();
    }

    public Flux<String> stream(String content) {
        return chatClient.prompt().user(content).stream().content();
    }
}

