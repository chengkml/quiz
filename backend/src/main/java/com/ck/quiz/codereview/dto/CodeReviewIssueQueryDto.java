package com.ck.quiz.codereview.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.codereview.entity.CodeReviewIssue;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CodeReviewIssueQueryDto extends QueryDto {
    private String keyWord;
    private String projectName;
    private String moduleName;
    private String source;
    private CodeReviewIssue.Status status;
    private CodeReviewIssue.Severity severity;
}
