package com.ck.quiz.knowledgeset.dto;

import lombok.Data;

@Data
public class VectorSyncCheckRequestDto {
    private String knowledgeSetId;
    private String knowledgeSourceId;
    private Integer sampleLimit;
}
