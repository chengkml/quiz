package com.ck.quiz.baidupan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BaiduPanMoveRequest {
    @NotEmpty(message = "移动源路径不能为空")
    private List<String> sourcePaths;

    @NotBlank(message = "目标路径不能为空")
    private String targetPath;
}
