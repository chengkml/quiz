package com.ck.quiz.category.dto;

import com.ck.quiz.base.dto.QueryDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CategoryQueryDto extends QueryDto {

    private String parentId;

    private String subjectId;

}
