package com.ck.quiz.knowledgeset.dto;

import com.ck.quiz.knowledgeset.entity.KnowledgeChunk;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VectorSearchResultDto {
    private KnowledgeChunk chunk;
    private Double distance; // 距离 (越小越相似)
    
    // 如果需要相似度分数 (0-1)，可以根据 distance 计算
    // Cosine Distance 范围通常是 0 到 2 (如果向量未归一化可能不同，但在 OpenAI embedding 下通常是归一化的)
}
