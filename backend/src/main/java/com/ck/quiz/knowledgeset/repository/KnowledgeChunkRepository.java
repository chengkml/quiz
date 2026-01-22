package com.ck.quiz.knowledgeset.repository;

import com.ck.quiz.knowledgeset.entity.KnowledgeChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, String> {
    List<KnowledgeChunk> findByKnowledgeSourceId(String knowledgeSourceId);
}
