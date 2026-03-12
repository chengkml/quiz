package com.ck.quiz.project.dto;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.project.entity.Requirement.Priority;
import com.ck.quiz.project.entity.Requirement.Status;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RequirementCreateDto extends CreateDto {
    @NotBlank(message = "Title cannot be empty")
    private String title;

    private String projectName;

    private String gitUrl;

    private String branch;

    private String descr;

    private Integer progressPercent;

    private Status status;
    
    private Priority priority;
}
