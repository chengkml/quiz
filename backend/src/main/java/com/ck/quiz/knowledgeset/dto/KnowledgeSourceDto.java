package com.ck.quiz.knowledgeset.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class KnowledgeSourceDto extends Dto {
    private String knowledgeSetId;
    private String name;
    private String type;
    private String status;
    private String content;
    private String meta;
    private String descr;
}
