package com.ck.quiz.codereview.dto;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.codereview.entity.CodeReviewTask;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class CodeReviewTaskCreateDto extends CreateDto {

    @NotBlank(message = "任务标题不能为空")
    @Size(max = 256, message = "任务标题不能超过256个字符")
    private String title;

    @Size(max = 128, message = "项目名不能超过128个字符")
    private String projectName;

    @Size(max = 512, message = "Git 仓库地址不能超过512个字符")
    private String gitUrl;

    @Size(max = 128, message = "分支名称不能超过128个字符")
    private String branch;

    @NotBlank(message = "目标页面不能为空")
    @Size(max = 256, message = "目标页面不能超过256个字符")
    private String targetPage;

    @Size(max = 64, message = "评审规范不能超过64个字符")
    private String reviewStandard;

    private String descr;

    private CodeReviewTask.Status status;
}
