package com.ck.quiz.knowledgeset.repository;

import com.ck.quiz.knowledgeset.entity.KnowledgeVector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface KnowledgeVectorRepository extends JpaRepository<KnowledgeVector, String> {

    /**
     * 向量相似度搜索 (Cosine Distance)
     * 
     * @param vectorStr 向量字符串 [v1, v2, ...]
     * @param limit     返回数量
     * @return 包含向量实体和距离的 Object 数组列表: [KnowledgeVector, Double]
     */
    @Query(value = "SELECT v.*, (v.embedding <=> cast(:vectorStr as vector)) as distance " +
                   "FROM knowledge_vector v " +
                   "LEFT JOIN knowledge_chunk c ON v.knowledge_chunk_id = c.id " +
                   "LEFT JOIN knowledge_source s ON c.knowledge_source_id = s.id " +
                   "WHERE (:knowledgeSetId IS NULL OR s.knowledge_set_id = :knowledgeSetId) " +
                   "ORDER BY distance ASC " +
                   "LIMIT :limit", nativeQuery = true)
    List<Object[]> searchSimilarWithDistance(
            @Param("vectorStr") String vectorStr, 
            @Param("limit") int limit,
            @Param("knowledgeSetId") String knowledgeSetId
    );

    void deleteByKnowledgeChunkIdIn(List<String> chunkIds);
}
