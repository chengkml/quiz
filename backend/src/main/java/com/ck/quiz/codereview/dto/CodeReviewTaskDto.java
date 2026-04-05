package com.ck.quiz.codereview.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.codereview.entity.CodeReviewTask;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CodeReviewTaskDto extends Dto {
    private String title;
    private String projectName;
    private String gitUrl;
    private String branch;
    private String targetPage;
    private String reviewStandard;
    private String descr;
    private CodeReviewTask.Status status;
}
