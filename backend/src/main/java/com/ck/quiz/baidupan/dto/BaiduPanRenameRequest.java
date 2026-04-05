package com.ck.quiz.baidupan.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class BaiduPanRenameRequest {
    @NotBlank(message = "文件路径不能为空")
    private String path;

    @NotBlank(message = "新名称不能为空")
    private String newName;
}
