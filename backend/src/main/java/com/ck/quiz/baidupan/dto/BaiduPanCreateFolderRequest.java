package com.ck.quiz.baidupan.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BaiduPanCreateFolderRequest {
    @NotBlank(message = "文件夹名称不能为空")
    private String name;

    private String parentPath;
}
