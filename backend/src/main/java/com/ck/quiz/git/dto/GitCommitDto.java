package com.ck.quiz.git.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class GitCommitDto {

    private String commitId;
    private String shortId;
    private String message;
    private String author;
    private String authorEmail;
    private LocalDateTime date;
    private List<String> parentIds;

    /** 该次提交涉及的文件变更（仅在获取详情时填充） */
    private List<FileChangeDto> changedFiles;
}
