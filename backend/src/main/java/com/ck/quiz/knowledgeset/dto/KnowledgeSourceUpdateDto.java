package com.ck.quiz.knowledgeset.dto;

import com.ck.quiz.base.dto.UpdateDto;
import lombok.Data;

@Data
public class KnowledgeSourceUpdateDto extends UpdateDto {
    private String name;
    private String type;
    private String status;
    private String content;
    private String meta;
    private String descr;
    private String tags;
    private String language;
}
