package com.ck.quiz.baidupan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaiduPanFileItemDto {
    private String name;
    private String path;
    private String parentPath;
    private boolean directory;
    private long size;
    private String extension;
    private boolean downloadSupported;
    private LocalDateTime modifiedAt;
}
