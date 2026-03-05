package com.ck.quiz.git.dto;

import com.ck.quiz.base.dto.UpdateDto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class GitRepoUpdateDto extends UpdateDto {

    private String name;

    private String remoteUrl;

    private String description;

    private String defaultBranch;

    private Integer sortOrder;
}
