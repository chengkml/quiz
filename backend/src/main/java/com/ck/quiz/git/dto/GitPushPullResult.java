package com.ck.quiz.git.dto;

import lombok.Data;
import java.util.List;

@Data
public class GitPushPullResult {

    private boolean success;
    private String message;
    private boolean hasConflicts;
    private List<String> conflictFiles;
}
