package com.ck.quiz.git.dto;

import lombok.Data;

@Data
public class GitBranchDto {

    private String name;
    private boolean isRemote;
    private boolean isCurrent;
    private String trackingBranch;
    private int aheadCount;
    private int behindCount;
}
