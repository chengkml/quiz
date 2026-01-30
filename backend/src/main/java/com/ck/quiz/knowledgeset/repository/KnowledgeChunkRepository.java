package com.ck.quiz.knowledgeset.repository;

import com.ck.quiz.knowledgeset.entity.KnowledgeChunk;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface KnowledgeChunkRepository extends JpaRepository<KnowledgeChunk, String> {
    List<KnowledgeChunk> findByKnowledgeSourceId(String knowledgeSourceId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT c.* FROM knowledge_chunk c " +
            "JOIN knowledge_source s ON c.knowledge_source_id = s.id " +
            "WHERE (:knowledgeSetId IS NULL OR s.knowledge_set_id = :knowledgeSetId) " +
            "AND c.content LIKE CONCAT('%', :keyword, '%')", nativeQuery = true)
    List<KnowledgeChunk> searchByText(@org.springframework.data.repository.query.Param("keyword") String keyword,
            @org.springframework.data.repository.query.Param("knowledgeSetId") String knowledgeSetId,
            org.springframework.data.domain.Pageable pageable);
}
