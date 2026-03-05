package com.ck.quiz.git.dto;

import lombok.Data;
import java.util.List;

@Data
public class GitStatusDto {

    private String repoId;
    private String repoName;
    private String currentBranch;
    private int ahead;
    private int behind;
    private boolean isClean;
    private List<FileChangeDto> changedFiles;
}
