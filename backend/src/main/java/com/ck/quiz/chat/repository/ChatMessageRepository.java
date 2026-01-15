package com.ck.quiz.chat.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.chat.entity.ChatMessage;

import java.util.List;

public interface ChatMessageRepository extends BaseRepository<ChatMessage> {

    List<ChatMessage> findBySessionIdOrderByCreateDateAsc(String sessionId);
}

