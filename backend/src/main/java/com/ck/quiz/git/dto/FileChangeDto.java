package com.ck.quiz.git.dto;

import lombok.Data;

@Data
public class FileChangeDto {

    private String filePath;

    /** ADD, MODIFY, DELETE, UNTRACKED, CONFLICT */
    private String changeType;

    private boolean staged;
}
