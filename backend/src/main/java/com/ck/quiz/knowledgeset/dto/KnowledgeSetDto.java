package com.ck.quiz.knowledgeset.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class KnowledgeSetDto extends Dto {

    private String name;

    private String descr;

    private String tags;

    private String visibility;

    private String defaultLanguage;

    private String status;
}

