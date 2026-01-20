package com.ck.quiz.chat.llm;

import com.ck.quiz.llmmodel.entity.LLMModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class SpringAiChatClientFacade {

    private final ChatClient defaultChatClient;

    public SpringAiChatClientFacade(ChatClient.Builder builder) {
        this.defaultChatClient = builder.build();
    }

    public String chat(String content) {
        return defaultChatClient.prompt().user(content).call().content();
    }

    public Flux<String> stream(String content) {
        return defaultChatClient.prompt().user(content).stream().content();
    }

    public Flux<String> stream(String content, LLMModel llmModel) {
        ChatClient client = createChatClient(llmModel);
        return client.prompt().user(content).stream().content();
    }

    private ChatClient createChatClient(LLMModel model) {
        if (model == null) {
            return defaultChatClient;
        }

        OpenAiApi openAiApi = OpenAiApi.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getApiEndpoint())
                .build();

        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(model.getName())
                .build();

        OpenAiChatModel chatModel = OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(options)
                .build();

        return ChatClient.builder(chatModel).build();
    }
}

