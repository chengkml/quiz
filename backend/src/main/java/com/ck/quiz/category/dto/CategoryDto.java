package com.ck.quiz.category.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class CategoryDto extends Dto {

    private String name;

    private String parentId;

    private String parentName;

    private String subjectId;

    private String subjectName;

    private String subjectLabel;

    private String descr;

    private List<CategoryDto> children;

    private int questionNum;

    private int knowledgeNum;
}