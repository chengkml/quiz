package com.ck.quiz.git.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class GitRepoCreateDto extends CreateDto {

    @NotBlank(message = "仓库名称不能为空")
    private String name;

    private String description;

    private String remoteUrl;

    private String gitUsername;

    private String gitPassword;

    private Integer sortOrder;
}
