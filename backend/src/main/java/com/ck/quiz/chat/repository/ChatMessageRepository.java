package com.ck.quiz.chat.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends BaseRepository<ChatMessage> {

    List<ChatMessage> findBySessionIdOrderByCreateDateAsc(String sessionId);

    @Modifying
    @Query("delete from ChatMessage m where m.sessionId = :sessionId")
    int deleteBySessionId(@Param("sessionId") String sessionId);
}
