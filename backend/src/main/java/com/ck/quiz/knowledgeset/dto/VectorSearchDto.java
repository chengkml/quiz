package com.ck.quiz.knowledgeset.dto;

import lombok.Data;

@Data
public class VectorSearchDto {
    private String query;
    private Integer topK = 5;
    private Double minScore; // 可选：最小相似度阈值
    private String modelName;
    private String knowledgeSetId;
    /**
     * VECTOR: 向量检索 (默认)
     * TEXT: 全文检索
     */
    private String searchType = "VECTOR";
}
