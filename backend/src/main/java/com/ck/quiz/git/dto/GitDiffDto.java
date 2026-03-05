package com.ck.quiz.git.dto;

import lombok.Data;

@Data
public class GitDiffDto {

    private String filePath;
    private String oldContent;
    private String newContent;

    /** unified diff 格式文本 */
    private String diffContent;
}
