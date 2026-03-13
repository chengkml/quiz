package com.ck.quiz.project.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.project.entity.Requirement;
import com.ck.quiz.project.entity.RequirementLifecycleLog;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class RequirementLifecycleLogDto extends Dto {

    private String requirementId;

    private RequirementLifecycleLog.EventType eventType;

    private Requirement.Status fromStatus;

    private Requirement.Status toStatus;

    private String beforeDescr;

    private String afterDescr;

    private String remark;
}
