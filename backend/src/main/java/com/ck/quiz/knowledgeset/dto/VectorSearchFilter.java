package com.ck.quiz.knowledgeset.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VectorSearchFilter {
    private String knowledgeSetId;
    private String knowledgeSourceId;
    private String searchType;
    private Double minScore;
}
