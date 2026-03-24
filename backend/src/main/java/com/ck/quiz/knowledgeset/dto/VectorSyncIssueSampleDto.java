package com.ck.quiz.knowledgeset.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VectorSyncIssueSampleDto {
    private String chunkId;
    private String vectorId;
    private String knowledgeSourceId;
    private String knowledgeSetId;
    private String createDate;
}
