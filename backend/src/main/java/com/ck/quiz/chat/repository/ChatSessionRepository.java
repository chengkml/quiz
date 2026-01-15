package com.ck.quiz.chat.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.chat.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface ChatSessionRepository extends BaseRepository<ChatSession> {

    Optional<ChatSession> findBySessionUuid(String sessionUuid);

    Page<ChatSession> findByCreateUserOrderByUpdateDateDesc(String createUser, Pageable pageable);
}

