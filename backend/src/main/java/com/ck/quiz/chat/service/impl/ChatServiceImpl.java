package com.ck.quiz.chat.service.impl;

import com.ck.quiz.chat.dto.ChatCompletionRequest;
import com.ck.quiz.chat.dto.ChatCompletionResponse;
import com.ck.quiz.chat.dto.ChatMessageDto;
import com.ck.quiz.chat.dto.ChatMessagePayload;
import com.ck.quiz.chat.dto.ChatReferenceDto;
import com.ck.quiz.chat.dto.ChatSessionDto;
import com.ck.quiz.chat.dto.ChatSessionExtraConfigDto;
import com.ck.quiz.chat.entity.ChatMessage;
import com.ck.quiz.chat.entity.ChatSession;
import com.ck.quiz.chat.repository.ChatMessageRepository;
import com.ck.quiz.chat.repository.ChatSessionRepository;
import com.ck.quiz.chat.service.ChatService;
import com.ck.quiz.knowledgeset.entity.KnowledgeSet;
import com.ck.quiz.knowledgeset.entity.KnowledgeSource;
import com.ck.quiz.knowledgeset.dto.VectorSearchFilter;
import com.ck.quiz.knowledgeset.dto.VectorSearchResultDto;
import com.ck.quiz.knowledgeset.repository.KnowledgeSetRepository;
import com.ck.quiz.knowledgeset.repository.KnowledgeSourceRepository;
import com.ck.quiz.knowledgeset.service.VectorService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.utils.IdHelper;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
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
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;

import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
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
    private final KnowledgeSetRepository knowledgeSetRepository;
    private final KnowledgeSourceRepository knowledgeSourceRepository;
    private final com.ck.quiz.tokenusage.service.TokenUsageService tokenUsageService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${chat.max-history-messages:20}")
    private int maxHistoryMessages;

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final String KNOWLEDGE_SCOPE_ALL_ACCESSIBLE = "ALL_ACCESSIBLE";
    private static final String KNOWLEDGE_SCOPE_KNOWLEDGE_SET = "KNOWLEDGE_SET";
    private static final int DEFAULT_RAG_TOP_K = 5;
    private static final String NO_ACCESSIBLE_KNOWLEDGE_MESSAGE = "当前没有可用于问答的知识集，请先创建或加入启用中的知识集。";
    private static final String NO_KNOWLEDGE_HIT_MESSAGE = "未在当前知识范围内检索到相关内容，请换个问法，或切换知识集后再试。";

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

        RetrievedContext retrievedContext = retrieveContext(userId, payload.getContent(), request);
        if (retrievedContext.shouldReplyDirectly()) {
            saveAssistantMessage(session, retrievedContext.getDirectReply(), userMessage.getSeq() + 1,
                    retrievedContext.getReferences());
            updateSession(session, userMessage.getContent());
            return buildResponse(session);
        }

        // Build Prompt
        Prompt prompt = buildPrompt(history, retrievedContext);

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
            log.error("璁板綍token浣跨敤澶辫触", e);
        }

        // Save Assistant Message
        saveAssistantMessage(session, answer, userMessage.getSeq() + 1, retrievedContext.getReferences());

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

        RetrievedContext retrievedContext = retrieveContext(userId, payload.getContent(), request);
        String assistantMessageId = IdHelper.genUuid();
        int assistantSeq = userMessage.getSeq() + 1;
        if (retrievedContext.shouldReplyDirectly()) {
            final String responseJson;
            try {
                responseJson = buildStreamResponse(session.getSessionUuid(), assistantMessageId,
                        retrievedContext.getDirectReply(), retrievedContext.getReferences());
            } catch (Exception e) {
                log.error("JSON serialize error", e);
                return Flux.error(e);
            }
            return Flux.just(responseJson)
                    .doOnComplete(() -> {
                        saveAssistantMessageWithId(session, retrievedContext.getDirectReply(), assistantSeq,
                                assistantMessageId, retrievedContext.getReferences());
                        updateSession(session, userMessage.getContent());
                    });
        }

        // Build Prompt
        Prompt prompt = buildPrompt(history, retrievedContext);

        StringBuilder contentBuilder = new StringBuilder();

        OpenAiChatModel chatModel = llmModelService.getChatModel(session.getModelName());
        ChatClient client = ChatClient.builder(chatModel).build();

        return client.prompt(prompt).stream().content()
                .map(content -> {
                    contentBuilder.append(content);
                    try {
                        return buildStreamResponse(session.getSessionUuid(), assistantMessageId, content,
                                retrievedContext.getReferences());
                    } catch (Exception e) {
                        log.error("JSON serialize error", e);
                        return "";
                    }
                })
                .filter(s -> !s.isEmpty())
                .doOnComplete(() -> {
                    String fullContent = contentBuilder.toString();
                    saveAssistantMessageWithId(session, fullContent, assistantSeq, assistantMessageId,
                            retrievedContext.getReferences());
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

    private void saveAssistantMessage(ChatSession session, String content, int seq,
            List<ChatReferenceDto> references) {
        saveAssistantMessageWithId(session, content, seq, IdHelper.genUuid(), references);
    }

    private void saveAssistantMessageWithId(ChatSession session, String content, int seq, String id,
            List<ChatReferenceDto> references) {
        ChatMessage assistantMessage = new ChatMessage();
        assistantMessage.setId(id);
        assistantMessage.setSessionId(session.getId());
        assistantMessage.setRole("ASSISTANT");
        assistantMessage.setContent(content);
        assistantMessage.setSeq(seq);
        assistantMessage.setErrorFlag(Boolean.FALSE);
        assistantMessage.setMeta(writeReferences(references));
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
        List<ChatMessageDto> messageDtos = trimmed.stream().map(this::toMessageDto).collect(Collectors.toList());
        response.setMessages(messageDtos);
        response.setReferences(resolveLatestAssistantReferences(messageDtos));

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
            log.warn("鑾峰彇token浣跨敤缁熻澶辫触", e);
            response.setUsage(null);
        }
        return response;
    }

    private RetrievedContext retrieveContext(String userId, String query, ChatCompletionRequest request) {
        if (!isKnowledgeMode(request)) {
            return RetrievedContext.general();
        }

        ResolvedKnowledgeScope scope = resolveKnowledgeScope(userId, request);
        if (scope.getKnowledgeSetIds().isEmpty()) {
            return RetrievedContext.knowledgeReplyOnly(NO_ACCESSIBLE_KNOWLEDGE_MESSAGE);
        }

        VectorSearchFilter filter = VectorSearchFilter.builder()
                .knowledgeSetIds(scope.getKnowledgeSetIds())
                .build();

        List<VectorSearchResultDto> results = vectorService.search(query, DEFAULT_RAG_TOP_K, null, filter);

        if (results == null || results.isEmpty()) {
            return RetrievedContext.knowledgeReplyOnly(NO_KNOWLEDGE_HIT_MESSAGE);
        }

        List<ChatReferenceDto> references = buildReferences(results);

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < results.size(); i++) {
            VectorSearchResultDto result = results.get(i);
            sb.append("[知识片段 ").append(i + 1).append("]\n")
                    .append(result.getChunk().getContent())
                    .append("\n\n");
        }
        return RetrievedContext.knowledgeContext(sb.toString().trim(), references);
    }

    private Prompt buildPrompt(List<ChatMessage> history, RetrievedContext retrievedContext) {
        List<ChatMessage> trimmed = trimHistory(history, maxHistoryMessages);
        List<org.springframework.ai.chat.messages.Message> messages = new ArrayList<>();

        String systemText = "You are a helpful assistant.";
        if (retrievedContext.isKnowledgeMode()) {
            systemText = "你是知识库问答助手。请严格基于提供的知识上下文回答问题。"
                    + "如果上下文不足以回答，请明确说明“未在当前知识范围内检索到足够信息”，不要编造内容，也不要使用未提供的外部知识。";
            if (StringUtils.hasText(retrievedContext.getRagContext())) {
                systemText += "\n\n以下是可用的知识上下文：\n" + retrievedContext.getRagContext();
            }
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

    private ResolvedKnowledgeScope resolveKnowledgeScope(String userId, ChatCompletionRequest request) {
        String normalizedScopeType = normalizeKnowledgeScopeType(request);
        String normalizedUserId = userId == null ? "" : userId;

        if (KNOWLEDGE_SCOPE_ALL_ACCESSIBLE.equals(normalizedScopeType)) {
            return new ResolvedKnowledgeScope(knowledgeSetRepository.findAccessibleEnabledIds(normalizedUserId));
        }

        if (KNOWLEDGE_SCOPE_KNOWLEDGE_SET.equals(normalizedScopeType)) {
            String knowledgeSetId = normalizeBlank(request.getKnowledgeSetId());
            if (!StringUtils.hasText(knowledgeSetId)) {
                throw new IllegalArgumentException("knowledgeSetId cannot be empty when knowledgeScopeType is KNOWLEDGE_SET");
            }
            if (knowledgeSetRepository.countAccessibleEnabledById(knowledgeSetId, normalizedUserId) <= 0) {
                throw new IllegalArgumentException("当前知识集不存在、未启用或无权限访问");
            }
            return new ResolvedKnowledgeScope(Collections.singletonList(knowledgeSetId));
        }

        return new ResolvedKnowledgeScope(Collections.emptyList());
    }

    private boolean isKnowledgeMode(ChatCompletionRequest request) {
        return StringUtils.hasText(request.getKnowledgeScopeType()) || StringUtils.hasText(request.getKnowledgeSetId());
    }

    private String normalizeKnowledgeScopeType(ChatCompletionRequest request) {
        String knowledgeScopeType = normalizeBlank(request.getKnowledgeScopeType());
        if (!StringUtils.hasText(knowledgeScopeType)) {
            return StringUtils.hasText(request.getKnowledgeSetId()) ? KNOWLEDGE_SCOPE_KNOWLEDGE_SET : null;
        }

        if (KNOWLEDGE_SCOPE_ALL_ACCESSIBLE.equalsIgnoreCase(knowledgeScopeType)) {
            return KNOWLEDGE_SCOPE_ALL_ACCESSIBLE;
        }
        if (KNOWLEDGE_SCOPE_KNOWLEDGE_SET.equalsIgnoreCase(knowledgeScopeType)) {
            return KNOWLEDGE_SCOPE_KNOWLEDGE_SET;
        }
        throw new IllegalArgumentException("unsupported knowledgeScopeType: " + knowledgeScopeType);
    }

    private String normalizeBlank(String value) {
        return StringUtils.hasText(value) ? value.trim() : null;
    }

    private String buildStreamResponse(String sessionId, String assistantMessageId, String content,
            List<ChatReferenceDto> references) throws com.fasterxml.jackson.core.JsonProcessingException {
        ChatCompletionResponse response = new ChatCompletionResponse();
        response.setSessionId(sessionId);
        response.setReferences(references);

        ChatMessageDto msgDto = new ChatMessageDto();
        msgDto.setId(assistantMessageId);
        msgDto.setRole("ASSISTANT");
        msgDto.setContent(content);
        msgDto.setReferences(references);
        response.setMessages(Collections.singletonList(msgDto));
        return objectMapper.writeValueAsString(response);
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
            boolean changed = false;
            String modelName = request.getConfig() != null ? request.getConfig().getModelName() : null;
            if (StringUtils.hasText(modelName) && !Objects.equals(session.getModelName(), modelName)) {
                session.setModelName(modelName);
                changed = true;
            }
            String extraConfig = writeSessionExtraConfig(request);
            if (!Objects.equals(session.getExtraConfig(), extraConfig)) {
                session.setExtraConfig(extraConfig);
                changed = true;
            }
            if (changed) {
                session = chatSessionRepository.save(session);
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
        session.setExtraConfig(writeSessionExtraConfig(request));
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
        dto.setReferences(readReferences(message.getMeta()));
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
        ChatSessionExtraConfigDto extraConfig = readSessionExtraConfig(session.getExtraConfig());
        dto.setKnowledgeScopeType(extraConfig != null ? extraConfig.getKnowledgeScopeType() : null);
        dto.setKnowledgeSetId(extraConfig != null ? extraConfig.getKnowledgeSetId() : null);
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

    @Override
    @Transactional
    public void deleteSession(String userId, String sessionUuid) {
        ChatSession session = chatSessionRepository.findBySessionUuid(sessionUuid)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        
        if (session.getCreateUser() != null && !session.getCreateUser().equals(userId)) {
            throw new IllegalArgumentException("No permission to delete this session");
        }
        
        // Delete all messages in the session first.
        chatMessageRepository.deleteBySessionId(session.getId());
        
        // 鍒犻櫎浼氳瘽
        chatSessionRepository.deleteById(session.getId());
        
        log.info("浼氳瘽宸插垹闄わ紝sessionUuid: {}, userId: {}", sessionUuid, userId);
    }

    private List<ChatReferenceDto> buildReferences(List<VectorSearchResultDto> results) {
        if (results == null || results.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> sourceIds = results.stream()
                .map(result -> result.getChunk() != null ? result.getChunk().getKnowledgeSourceId() : null)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());

        java.util.Map<String, KnowledgeSource> sourceMap = knowledgeSourceRepository.findAllById(sourceIds).stream()
                .collect(Collectors.toMap(KnowledgeSource::getId, source -> source));
        List<String> knowledgeSetIds = sourceMap.values().stream()
                .map(KnowledgeSource::getKnowledgeSetId)
                .filter(StringUtils::hasText)
                .distinct()
                .collect(Collectors.toList());
        java.util.Map<String, KnowledgeSet> knowledgeSetMap = knowledgeSetRepository.findAllById(knowledgeSetIds).stream()
                .collect(Collectors.toMap(KnowledgeSet::getId, knowledgeSet -> knowledgeSet));

        List<ChatReferenceDto> references = new ArrayList<>();
        for (VectorSearchResultDto result : results) {
            if (result.getChunk() == null) {
                continue;
            }

            KnowledgeSource source = sourceMap.get(result.getChunk().getKnowledgeSourceId());
            if (source == null) {
                continue;
            }

            KnowledgeSet knowledgeSet = knowledgeSetMap.get(source.getKnowledgeSetId());
            ChatReferenceDto reference = new ChatReferenceDto();
            reference.setKnowledgeSetId(source.getKnowledgeSetId());
            reference.setKnowledgeSetName(knowledgeSet != null ? knowledgeSet.getName() : null);
            reference.setKnowledgeSourceId(source.getId());
            reference.setKnowledgeSourceName(source.getName());
            reference.setChunkIndex(result.getChunk().getChunkIndex());
            reference.setDistance(result.getDistance());
            references.add(reference);
        }
        return references;
    }

    private String writeReferences(List<ChatReferenceDto> references) {
        if (references == null || references.isEmpty()) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(references);
        } catch (Exception e) {
            log.warn("serialize chat references failed", e);
            return null;
        }
    }

    private List<ChatReferenceDto> readReferences(String meta) {
        if (!StringUtils.hasText(meta)) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(meta, new TypeReference<List<ChatReferenceDto>>() {
            });
        } catch (Exception e) {
            log.warn("parse chat references failed", e);
            return Collections.emptyList();
        }
    }

    private ChatSessionExtraConfigDto readSessionExtraConfig(String extraConfig) {
        if (!StringUtils.hasText(extraConfig)) {
            return null;
        }
        try {
            return objectMapper.readValue(extraConfig, ChatSessionExtraConfigDto.class);
        } catch (Exception e) {
            log.warn("parse chat session extra config failed", e);
            return null;
        }
    }

    private String writeSessionExtraConfig(ChatCompletionRequest request) {
        if (!isKnowledgeMode(request)) {
            return null;
        }

        ChatSessionExtraConfigDto extraConfig = new ChatSessionExtraConfigDto();
        extraConfig.setKnowledgeScopeType(normalizeKnowledgeScopeType(request));
        extraConfig.setKnowledgeSetId(normalizeBlank(request.getKnowledgeSetId()));
        try {
            return objectMapper.writeValueAsString(extraConfig);
        } catch (Exception e) {
            log.warn("serialize chat session extra config failed", e);
            return null;
        }
    }

    private List<ChatReferenceDto> resolveLatestAssistantReferences(List<ChatMessageDto> messages) {
        if (messages == null || messages.isEmpty()) {
            return Collections.emptyList();
        }
        for (int i = messages.size() - 1; i >= 0; i--) {
            ChatMessageDto message = messages.get(i);
            if ("ASSISTANT".equalsIgnoreCase(message.getRole()) && message.getReferences() != null
                    && !message.getReferences().isEmpty()) {
                return message.getReferences();
            }
        }
        return Collections.emptyList();
    }

    private static class RetrievedContext {
        private final boolean knowledgeMode;
        private final String ragContext;
        private final String directReply;
        private final List<ChatReferenceDto> references;

        private RetrievedContext(boolean knowledgeMode, String ragContext, String directReply,
                List<ChatReferenceDto> references) {
            this.knowledgeMode = knowledgeMode;
            this.ragContext = ragContext;
            this.directReply = directReply;
            this.references = references == null ? Collections.emptyList() : references;
        }

        private static RetrievedContext general() {
            return new RetrievedContext(false, null, null, Collections.emptyList());
        }

        private static RetrievedContext knowledgeContext(String ragContext, List<ChatReferenceDto> references) {
            return new RetrievedContext(true, ragContext, null, references);
        }

        private static RetrievedContext knowledgeReplyOnly(String directReply) {
            return new RetrievedContext(true, null, directReply, Collections.emptyList());
        }

        private boolean isKnowledgeMode() {
            return knowledgeMode;
        }

        private String getRagContext() {
            return ragContext;
        }

        private String getDirectReply() {
            return directReply;
        }

        private List<ChatReferenceDto> getReferences() {
            return references;
        }

        private boolean shouldReplyDirectly() {
            return StringUtils.hasText(directReply);
        }
    }

    private static class ResolvedKnowledgeScope {
        private final List<String> knowledgeSetIds;

        private ResolvedKnowledgeScope(List<String> knowledgeSetIds) {
            this.knowledgeSetIds = knowledgeSetIds;
        }

        private List<String> getKnowledgeSetIds() {
            return knowledgeSetIds;
        }
    }
}
