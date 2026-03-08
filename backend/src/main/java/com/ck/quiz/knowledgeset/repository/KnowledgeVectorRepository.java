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
     * 说明：
     * 1. 仅检索与查询向量维度一致的数据，避免不同维度导致 pgvector 计算报错。
     * 2. 支持按知识集、知识来源、模型名过滤。
     */
    @Query(value = "SELECT v.id as id, " +
            "v.knowledge_chunk_id as knowledgeChunkId, " +
            "v.dimension as dimension, " +
            "v.model as model, " +
            "(v.embedding <=> cast(:vectorStr as vector)) as distance " +
            "FROM knowledge_vector v " +
            "JOIN knowledge_chunk c ON v.knowledge_chunk_id = c.id " +
            "JOIN knowledge_source s ON c.knowledge_source_id = s.id " +
            "WHERE v.dimension = :dimension " +
            "AND (:modelName IS NULL OR v.model = :modelName) " +
            "AND (:knowledgeSetId IS NULL OR s.knowledge_set_id = :knowledgeSetId) " +
            "AND (:knowledgeSourceId IS NULL OR c.knowledge_source_id = :knowledgeSourceId) " +
            "ORDER BY distance ASC " +
            "LIMIT :limit", nativeQuery = true)
    List<VectorSearchProjection> searchSimilarWithDistance(
            @Param("vectorStr") String vectorStr,
            @Param("limit") int limit,
            @Param("dimension") int dimension,
            @Param("modelName") String modelName,
            @Param("knowledgeSetId") String knowledgeSetId,
            @Param("knowledgeSourceId") String knowledgeSourceId
    );

    void deleteByKnowledgeChunkIdIn(List<String> chunkIds);
}
