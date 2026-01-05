package com.ck.quiz.subject.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.category.dto.CategoryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true)
public class SubjectDto extends Dto {

    private String name;

    private String label;

    private String descr;

    private List<CategoryDto> categories;

    private int questionNum;

    private int knowledgeNum;

}