package com.ck.quiz.knowledgeset.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VectorSearchFilter {
    private String knowledgeSetId;
    private List<String> knowledgeSetIds;
    private String knowledgeSourceId;
    private String searchType;
    private Double minScore;
}
