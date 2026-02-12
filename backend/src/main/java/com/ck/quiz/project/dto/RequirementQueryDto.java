package com.ck.quiz.project.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.project.entity.Requirement.Priority;
import com.ck.quiz.project.entity.Requirement.Status;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RequirementQueryDto extends QueryDto {
    private String title;
    private String projectName;
    private Status status;
    private Priority priority;
}
