package com.ck.quiz.chat.service;

import com.ck.quiz.chat.dto.ChatCompletionRequest;
import com.ck.quiz.chat.dto.ChatCompletionResponse;
import com.ck.quiz.chat.dto.ChatMessageDto;
import com.ck.quiz.chat.dto.ChatSessionDto;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ChatService {

    ChatCompletionResponse chat(String userId, ChatCompletionRequest request);

    Page<ChatSessionDto> listSessions(String userId, int page, int size);

    List<ChatMessageDto> listMessages(String userId, String sessionId, int limit);
}

