package com.ck.quiz.knowledgeset.repository;

public interface VectorSearchProjection {
    String getId();

    String getKnowledgeChunkId();

    Integer getDimension();

    String getModel();

    Double getDistance();
}
