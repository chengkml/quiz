package com.ck.quiz.chat.service.impl;

import com.ck.quiz.chat.dto.ChatCompletionRequest;
import com.ck.quiz.chat.dto.ChatCompletionResponse;
import com.ck.quiz.chat.dto.ChatConfig;
import com.ck.quiz.chat.dto.ChatMessageDto;
import com.ck.quiz.chat.dto.ChatMessagePayload;
import com.ck.quiz.chat.dto.ChatSessionDto;
import com.ck.quiz.chat.dto.ChatUsageDto;
import com.ck.quiz.chat.entity.ChatMessage;
import com.ck.quiz.chat.entity.ChatSession;

import com.ck.quiz.chat.repository.ChatMessageRepository;
import com.ck.quiz.chat.repository.ChatSessionRepository;
import com.ck.quiz.chat.service.ChatService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import reactor.core.publisher.Flux;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final LLMModelService llmModelService;

    @Value("${chat.max-history-messages:20}")
    private int maxHistoryMessages;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public ChatCompletionResponse chat(String userId, ChatCompletionRequest request) {
        if (request == null || request.getMessage() == null || !StringUtils.hasText(request.getMessage().getContent())) {
            throw new IllegalArgumentException("message content cannot be empty");
        }
        ChatSession session = resolveSession(userId, request);
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByCreateDateAsc(session.getId());
        ChatMessagePayload payload = request.getMessage();
        ChatMessage userMessage = new ChatMessage();
        userMessage.setId(IdHelper.genUuid());
        userMessage.setSessionId(session.getId());
        userMessage.setRole("USER");
        userMessage.setContent(payload.getContent());
        userMessage.setSeq(history.isEmpty() ? 1 : history.get(history.size() - 1).getSeq() + 1);
        userMessage.setErrorFlag(Boolean.FALSE);
        chatMessageRepository.save(userMessage);
        history.add(userMessage);
        String combinedPrompt = buildCombinedPrompt(history);
        OpenAiChatModel chatModel = llmModelService.getChatModel(session.getModelName());
        ChatClient client = ChatClient.builder(chatModel).build();
        String answer = client.prompt().user(combinedPrompt).call().content();
        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setId(IdHelper.genUuid());
        assistantMessage.setSessionId(session.getId());
        assistantMessage.setRole("ASSISTANT");
        assistantMessage.setContent(answer);
        assistantMessage.setSeq(userMessage.getSeq() + 1);
        assistantMessage.setErrorFlag(Boolean.FALSE);
        chatMessageRepository.save(assistantMessage);
        session.setTitle(resolveSessionTitle(session.getTitle(), userMessage.getContent()));
        session.setStatus("ACTIVE");
        chatSessionRepository.save(session);
        List<ChatMessage> latestMessages = chatMessageRepository.findBySessionIdOrderByCreateDateAsc(session.getId());
        List<ChatMessage> trimmed = trimHistory(latestMessages, maxHistoryMessages);
        ChatCompletionResponse response = new ChatCompletionResponse();
        response.setSessionId(session.getSessionUuid());
        response.setMessages(trimmed.stream().map(this::toMessageDto).collect(Collectors.toList()));
        response.setUsage(null);
        return response;
    }

    @Override
    public Flux<ChatCompletionResponse> streamChat(String userId, ChatCompletionRequest request) {
        if (request == null || request.getMessage() == null || !StringUtils.hasText(request.getMessage().getContent())) {
            throw new IllegalArgumentException("message content cannot be empty");
        }

        ChatSession session = resolveSession(userId, request);
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByCreateDateAsc(session.getId());
        ChatMessagePayload payload = request.getMessage();

        ChatMessage userMessage = new ChatMessage();
        userMessage.setId(IdHelper.genUuid());
        userMessage.setSessionId(session.getId());
        userMessage.setRole("USER");
        userMessage.setContent(payload.getContent());
        userMessage.setSeq(history.isEmpty() ? 1 : history.get(history.size() - 1).getSeq() + 1);
        userMessage.setErrorFlag(Boolean.FALSE);
        chatMessageRepository.save(userMessage);

        history.add(userMessage);
        String combinedPrompt = buildCombinedPrompt(history);

        String assistantMessageId = IdHelper.genUuid();
        int assistantSeq = userMessage.getSeq() + 1;

        StringBuilder contentBuilder = new StringBuilder();

        OpenAiChatModel chatModel = llmModelService.getChatModel(session.getModelName());
        ChatClient client = ChatClient.builder(chatModel).build();
        return client.prompt().user(combinedPrompt).stream().content()
                .map(content -> {
                    contentBuilder.append(content);
                    ChatCompletionResponse response = new ChatCompletionResponse();
                    response.setSessionId(session.getSessionUuid());
                    ChatMessageDto msgDto = new ChatMessageDto();
                    msgDto.setId(assistantMessageId);
                    msgDto.setRole("ASSISTANT");
                    msgDto.setContent(content);
                    response.setMessages(Collections.singletonList(msgDto));
                    return response;
                })
                .doOnComplete(() -> {
                    String fullContent = contentBuilder.toString();
                    ChatMessage assistantMessage = new ChatMessage();
                    assistantMessage.setId(assistantMessageId);
                    assistantMessage.setSessionId(session.getId());
                    assistantMessage.setRole("ASSISTANT");
                    assistantMessage.setContent(fullContent);
                    assistantMessage.setSeq(assistantSeq);
                    assistantMessage.setErrorFlag(Boolean.FALSE);
                    chatMessageRepository.save(assistantMessage);

                    session.setTitle(resolveSessionTitle(session.getTitle(), userMessage.getContent()));
                    session.setStatus("ACTIVE");
                    chatSessionRepository.save(session);
                });
    }

    @Override
    public Page<ChatSessionDto> listSessions(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), size <= 0 ? 20 : size);
        Page<ChatSession> sessionPage = chatSessionRepository.findByCreateUserOrderByUpdateDateDesc(userId, pageable);
        List<ChatSessionDto> dtos = sessionPage.getContent().stream().map(this::toSessionDto).collect(Collectors.toList());
        return new PageImpl<>(dtos, pageable, sessionPage.getTotalElements());
    }

    @Override
    public List<ChatMessageDto> listMessages(String userId, String sessionUuid, int limit) {
        ChatSession session = chatSessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new IllegalArgumentException("session not found"));
        if (session.getCreateUser() != null && !session.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("no permission to access session");
        }
        List<ChatMessage> all = chatMessageRepository.findBySessionIdOrderByCreateDateAsc(session.getId());
        List<ChatMessage> trimmed = trimHistory(all, limit > 0 ? limit : maxHistoryMessages);
        return trimmed.stream().map(this::toMessageDto).collect(Collectors.toList());
    }

    private ChatSession resolveSession(String userId, ChatCompletionRequest request) {
        String sessionUuid = request.getSessionId();
        if (StringUtils.hasText(sessionUuid)) {
            Optional<ChatSession> optional = chatSessionRepository.findBySessionUuid(sessionUuid);
            if (optional.isEmpty()) {
                throw new IllegalArgumentException("session not found");
            }
            ChatSession session = optional.get();
            if (session.getCreateUser() != null && !session.getCreateUser().equals(userId)) {
                throw new IllegalArgumentException("no permission to access session");
            }
            return session;
        }
        ChatSession session = new ChatSession();
        session.setId(IdHelper.genUuid());
        session.setSessionUuid(IdHelper.genUuid());
        session.setModelName(request.getConfig() != null ? request.getConfig().getModelName() : null);
        session.setTemperature(request.getConfig() != null ? request.getConfig().getTemperature() : null);
        session.setMaxTokens(request.getConfig() != null ? request.getConfig().getMaxTokens() : null);
        session.setStatus("ACTIVE");
        return chatSessionRepository.save(session);
    }

    private String buildCombinedPrompt(List<ChatMessage> history) {
        List<ChatMessage> trimmed = trimHistory(history, maxHistoryMessages);
        StringBuilder sb = new StringBuilder();
        for (ChatMessage message : trimmed) {
            String role = message.getRole();
            if ("ASSISTANT".equalsIgnoreCase(role)) {
                sb.append("Assistant: ");
            } else if ("SYSTEM".equalsIgnoreCase(role)) {
                sb.append("System: ");
            } else {
                sb.append("User: ");
            }
            sb.append(message.getContent()).append("\n");
        }
        return sb.toString();
    }

    private List<ChatMessage> trimHistory(List<ChatMessage> history, int maxSize) {
        if (history == null || history.isEmpty()) {
            return Collections.emptyList();
        }
        List<ChatMessage> sorted = new ArrayList<>(history);
        sorted.sort(Comparator.comparing(ChatMessage::getSeq).thenComparing(ChatMessage::getCreateDate));
        if (sorted.size() <= maxSize) {
            return sorted;
        }
        return sorted.subList(sorted.size() - maxSize, sorted.size());
    }

    private ChatMessageDto toMessageDto(ChatMessage message) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(message.getId());
        dto.setRole(message.getRole());
        dto.setContent(message.getContent());
        if (message.getCreateDate() != null) {
            dto.setCreatedAt(message.getCreateDate().format(DATE_TIME_FORMATTER));
        }
        return dto;
    }

    private ChatSessionDto toSessionDto(ChatSession session) {
        ChatSessionDto dto = new ChatSessionDto();
        dto.setSessionId(session.getSessionUuid());
        dto.setTitle(session.getTitle());
        dto.setModelName(session.getModelName());
        if (session.getUpdateDate() != null) {
            dto.setUpdatedAt(session.getUpdateDate().format(DATE_TIME_FORMATTER));
        } else if (session.getCreateDate() != null) {
            dto.setUpdatedAt(session.getCreateDate().format(DATE_TIME_FORMATTER));
        }
        return dto;
    }

    private String resolveSessionTitle(String originalTitle, String content) {
        if (StringUtils.hasText(originalTitle)) {
            return originalTitle;
        }
        if (!StringUtils.hasText(content)) {
            return originalTitle;
        }
        String trimmed = content.trim();
        if (trimmed.length() > 50) {
            return trimmed.substring(0, 50);
        }
        return trimmed;
    }
}

