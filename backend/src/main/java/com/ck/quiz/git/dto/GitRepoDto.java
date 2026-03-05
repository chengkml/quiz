package com.ck.quiz.git.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class GitRepoDto extends Dto {

    private String name;

    private String localPath;

    private String remoteUrl;

    private String defaultBranch;

    private String description;

    private Integer sortOrder;

    /** 路径是否有效（运行时动态判断） */
    private Boolean isValid;

    /** 当前分支（运行时动态获取） */
    private String currentBranch;
}
