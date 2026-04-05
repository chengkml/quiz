package com.ck.quiz.codereview.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.codereview.entity.CodeReviewTask;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CodeReviewTaskQueryDto extends QueryDto {
    private String title;
    private String projectName;
    private String targetPage;
    private CodeReviewTask.Status status;
}
