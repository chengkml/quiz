package com.ck.quiz.codereview.dto;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.codereview.entity.CodeReviewIssue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CodeReviewIssueCreateDto extends CreateDto {

    @NotBlank(message = "问题标题不能为空")
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
}
