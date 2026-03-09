package com.ck.quiz.codereview.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.codereview.entity.CodeReviewIssue;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CodeReviewIssueDto extends Dto {
    private String title;
    private String projectName;
    private String moduleName;
    private String filePath;
    private Integer lineNo;
    private CodeReviewIssue.Severity severity;
    private CodeReviewIssue.Status status;
    private String source;
    private String issueDetail;
    private String suggestion;
    private String requirementId;
}
