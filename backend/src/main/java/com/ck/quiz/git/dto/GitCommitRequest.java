package com.ck.quiz.git.dto;

import lombok.Data;
import java.util.List;

@Data
public class GitCommitRequest {

    private String message;
    private List<String> filesToStage;
    private boolean amend;
}
