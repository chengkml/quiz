package com.ck.quiz.codereview.dto;

import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.codereview.entity.CodeReviewIssue;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CodeReviewIssueUpdateDto extends UpdateDto {

    @Size(max = 32, message = "评审任务ID不能超过32个字符")
    private String taskId;

    @Size(max = 256, message = "问题标题不能超过256个字符")
    private String title;

    @Size(max = 128, message = "项目名不能超过128个字符")
    private String projectName;

    @Size(max = 128, message = "模块名不能超过128个字符")
    private String moduleName;

    @Size(max = 512, message = "文件路径不能超过512个字符")
    private String filePath;

    private Integer lineNo;

    private CodeReviewIssue.Severity severity;

    private CodeReviewIssue.Status status;

    @Size(max = 64, message = "来源不能超过64个字符")
    private String source;

    private String issueDetail;

    private String suggestion;

    private String requirementId;
}
