package com.ck.quiz.chat.dto;

import lombok.Data;

@Data
public class ChatReferenceDto {

    private String knowledgeSetId;

    private String knowledgeSetName;

    private String knowledgeSourceId;

    private String knowledgeSourceName;

    private Integer chunkIndex;

    private Double distance;
}
