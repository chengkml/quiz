package com.ck.quiz.chat.service.impl;

import com.ck.quiz.chat.dto.ChatCompletionRequest;
import com.ck.quiz.chat.dto.ChatCompletionResponse;
import com.ck.quiz.chat.dto.ChatMessageDto;
import com.ck.quiz.chat.dto.ChatMessagePayload;
import com.ck.quiz.chat.dto.ChatSessionDto;
import com.ck.quiz.chat.entity.ChatMessage;
import com.ck.quiz.chat.entity.ChatSession;
import com.ck.quiz.chat.repository.ChatMessageRepository;
import com.ck.quiz.chat.repository.ChatSessionRepository;
import com.ck.quiz.chat.service.ChatService;
import com.ck.quiz.knowledgeset.dto.VectorSearchFilter;
import com.ck.quiz.knowledgeset.dto.VectorSearchResultDto;
import com.ck.quiz.knowledgeset.service.VectorService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
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

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final LLMModelService llmModelService;
    private final VectorService vectorService;
    private final com.ck.quiz.tokenusage.service.TokenUsageService tokenUsageService;

    @Value("${chat.max-history-messages:20}")
    private int maxHistoryMessages;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    public ChatCompletionResponse chat(String userId, ChatCompletionRequest request) {
        if (request == null || request.getMessage() == null
                || !StringUtils.hasText(request.getMessage().getContent())) {
            throw new IllegalArgumentException("message content cannot be empty");
        }
        ChatSession session = resolveSession(userId, request);
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByCreateDateAsc(session.getId());
        ChatMessagePayload payload = request.getMessage();

        // Save User Message
        ChatMessage userMessage = saveUserMessage(session.getId(), payload.getContent(), history);
        history.add(userMessage);

        // Retrieve Context (RAG)
        String context = retrieveContext(payload.getContent(), request.getKnowledgeSetId(), session.getModelName());

        // Build Prompt
        Prompt prompt = buildPrompt(history, context);

        // Call LLM
        OpenAiChatModel chatModel = llmModelService.getChatModel(session.getModelName());
        ChatClient client = ChatClient.builder(chatModel).build();
        ChatResponse response = client.prompt(prompt).call().chatResponse();
        String answer = response.getResult().getOutput().getText();

        // Record token usage
        try {
            tokenUsageService.recordUsage(
                    session.getModelName(),
                    chatModel.getDefaultOptions() != null ? "OpenAI" : null,
                    response.getMetadata(),
                    "CHAT",
                    session.getId(),
                    session.getSessionUuid(),
                    payload.getContent(),
                    answer,
                    userId);
        } catch (Exception e) {
            log.error("记录token使用失败", e);
        }

        // Save Assistant Message
        saveAssistantMessage(session, answer, userMessage.getSeq() + 1);

        // Update Session
        updateSession(session, userMessage.getContent());

        // Return Response
        return buildResponse(session);
    }

    @Override
    public Flux<String> streamChat(String userId, ChatCompletionRequest request) {
        if (request == null || request.getMessage() == null
                || !StringUtils.hasText(request.getMessage().getContent())) {
            throw new IllegalArgumentException("message content cannot be empty");
        }

        ChatSession session = resolveSession(userId, request);
        List<ChatMessage> history = chatMessageRepository.findBySessionIdOrderByCreateDateAsc(session.getId());
        ChatMessagePayload payload = request.getMessage();

        // Save User Message
        ChatMessage userMessage = saveUserMessage(session.getId(), payload.getContent(), history);
        history.add(userMessage);

        // Retrieve Context (RAG)
        String context = retrieveContext(payload.getContent(), request.getKnowledgeSetId(), session.getModelName());

        // Build Prompt
        Prompt prompt = buildPrompt(history, context);

        String assistantMessageId = IdHelper.genUuid();
        int assistantSeq = userMessage.getSeq() + 1;
        StringBuilder contentBuilder = new StringBuilder();

        OpenAiChatModel chatModel = llmModelService.getChatModel(session.getModelName());
        ChatClient client = ChatClient.builder(chatModel).build();
        
        // 使用 ObjectMapper 手动序列化，确保流式输出
        com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

        return client.prompt(prompt).stream().content()
                .map(content -> {
                    contentBuilder.append(content);
                    ChatCompletionResponse response = new ChatCompletionResponse();
                    response.setSessionId(session.getSessionUuid());
                    ChatMessageDto msgDto = new ChatMessageDto();
                    msgDto.setId(assistantMessageId);
                    msgDto.setRole("ASSISTANT");
                    msgDto.setContent(content);
                    response.setMessages(Collections.singletonList(msgDto));
                    try {
                        return objectMapper.writeValueAsString(response);
                    } catch (Exception e) {
                        log.error("JSON serialize error", e);
                        return "";
                    }
                })
                .filter(s -> !s.isEmpty())
                .doOnComplete(() -> {
                    String fullContent = contentBuilder.toString();
                    saveAssistantMessageWithId(session, fullContent, assistantSeq, assistantMessageId);
                    updateSession(session, userMessage.getContent());
                });
    }

    private ChatMessage saveUserMessage(String sessionId, String content, List<ChatMessage> history) {
        ChatMessage userMessage = new ChatMessage();
        userMessage.setId(IdHelper.genUuid());
        userMessage.setSessionId(sessionId);
        userMessage.setRole("USER");
        userMessage.setContent(content);
        userMessage.setSeq(history.isEmpty() ? 1 : history.get(history.size() - 1).getSeq() + 1);
        userMessage.setErrorFlag(Boolean.FALSE);
        return chatMessageRepository.save(userMessage);
    }

    private void saveAssistantMessage(ChatSession session, String content, int seq) {
        saveAssistantMessageWithId(session, content, seq, IdHelper.genUuid());
    }

    private void saveAssistantMessageWithId(ChatSession session, String content, int seq, String id) {
        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setId(id);
        assistantMessage.setSessionId(session.getId());
        assistantMessage.setRole("ASSISTANT");
        assistantMessage.setContent(content);
        assistantMessage.setSeq(seq);
        assistantMessage.setErrorFlag(Boolean.FALSE);
        chatMessageRepository.save(assistantMessage);
    }

    private void updateSession(ChatSession session, String userContent) {
        session.setTitle(resolveSessionTitle(session.getTitle(), userContent));
        session.setStatus("ACTIVE");
        chatSessionRepository.save(session);
    }

    private ChatCompletionResponse buildResponse(ChatSession session) {
        List<ChatMessage> latestMessages = chatMessageRepository.findBySessionIdOrderByCreateDateAsc(session.getId());
        List<ChatMessage> trimmed = trimHistory(latestMessages, maxHistoryMessages);
        ChatCompletionResponse response = new ChatCompletionResponse();
        response.setSessionId(session.getSessionUuid());
        response.setMessages(trimmed.stream().map(this::toMessageDto).collect(Collectors.toList()));

        // Calculate total usage for this session
        try {
            List<com.ck.quiz.tokenusage.entity.TokenUsage> usageList = tokenUsageService
                    .queryBySessionId(session.getSessionUuid()).stream()
                    .map(dto -> {
                        com.ck.quiz.tokenusage.entity.TokenUsage usage = new com.ck.quiz.tokenusage.entity.TokenUsage();
                        usage.setPromptTokens(dto.getPromptTokens());
                        usage.setCompletionTokens(dto.getCompletionTokens());
                        usage.setTotalTokens(dto.getTotalTokens());
                        return usage;
                    }).collect(Collectors.toList());

            if (!usageList.isEmpty()) {
                com.ck.quiz.chat.dto.ChatUsageDto usageDto = new com.ck.quiz.chat.dto.ChatUsageDto();
                usageDto.setPromptTokens(
                        usageList.stream().mapToInt(com.ck.quiz.tokenusage.entity.TokenUsage::getPromptTokens).sum());
                usageDto.setCompletionTokens(usageList.stream()
                        .mapToInt(com.ck.quiz.tokenusage.entity.TokenUsage::getCompletionTokens).sum());
                usageDto.setTotalTokens(
                        usageList.stream().mapToInt(com.ck.quiz.tokenusage.entity.TokenUsage::getTotalTokens).sum());
                response.setUsage(usageDto);
            } else {
                response.setUsage(null);
            }
        } catch (Exception e) {
            log.warn("获取token使用统计失败", e);
            response.setUsage(null);
        }
        return response;
    }

    private String retrieveContext(String query, String knowledgeSetId, String modelName) {
        if (!StringUtils.hasText(knowledgeSetId)) {
            return "";
        }

        VectorSearchFilter filter = VectorSearchFilter.builder()
                .knowledgeSetId(knowledgeSetId)
                .build();

        List<VectorSearchResultDto> results = vectorService.search(query, 3, null, filter);

        if (results == null || results.isEmpty()) {
            return "";
        }

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < results.size(); i++) {
            VectorSearchResultDto result = results.get(i);
            sb.append(i + 1).append(". ").append(result.getChunk().getContent()).append("\n");
        }
        return sb.toString();
    }

    private Prompt buildPrompt(List<ChatMessage> history, String ragContext) {
        List<ChatMessage> trimmed = trimHistory(history, maxHistoryMessages);
        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();

        // System Prompt
        String systemText = "You are a helpful assistant.";

        // Attempt to load system prompt from template if configured in session
        // (assuming session might have promptTemplateId)
        // Or if simple logic: if it's the global assistant (no ID in request, new
        // session), maybe check a global setting?
        // For now, let's keep it simple but allow extension.
        // We can add a "systemPrompt" field to ChatConfig or ChatSession later.

        if (StringUtils.hasText(ragContext)) {
            systemText += "\n\nPlease answer the user's question based on the following context:\n" + ragContext +
                    "\n\nIf the context does not contain the answer, please answer based on your own knowledge.";
        }
        messages.add(new org.springframework.ai.chat.messages.SystemMessage(systemText));

        // History Messages
        for (ChatMessage message : trimmed) {
            String role = message.getRole();
            if ("ASSISTANT".equalsIgnoreCase(role)) {
                messages.add(new org.springframework.ai.chat.messages.AssistantMessage(message.getContent()));
            } else if ("USER".equalsIgnoreCase(role)) {
                messages.add(new UserMessage(message.getContent()));
            }
        }
        return new Prompt(messages);
    }

    @Override
    public Page<ChatSessionDto> listSessions(String userId, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), size <= 0 ? 20 : size);
        Page<ChatSession> sessionPage = chatSessionRepository.findByCreateUserOrderByUpdateDateDesc(userId, pageable);
        List<ChatSessionDto> dtos = sessionPage.getContent().stream().map(this::toSessionDto)
                .collect(Collectors.toList());
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
        session.setCreateUser(userId); // Ensure user is set
        return chatSessionRepository.save(session);
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
