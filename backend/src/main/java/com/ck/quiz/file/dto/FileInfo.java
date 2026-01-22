package com.ck.quiz.file.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileInfo {
    private String id;
    private String name;
    private String path;
    private long size;
    private boolean isDirectory;
    private LocalDateTime lastModified;
}
