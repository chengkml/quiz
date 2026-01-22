package com.ck.quiz.knowledgeset.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;

@Data
public class KnowledgeSourceQueryDto extends QueryDto {
    private String knowledgeSetId;
    private String name;
    private String type;
    private String status;
}
