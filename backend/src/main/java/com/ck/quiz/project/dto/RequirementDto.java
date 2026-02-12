package com.ck.quiz.project.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.project.entity.Requirement.Priority;
import com.ck.quiz.project.entity.Requirement.Status;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RequirementDto extends Dto {
    private String title;
    private String projectName;
    private String gitUrl;
    private String branch;
    private String descr;
    private String resultMsg;
    private Status status;
    private Priority priority;
}
