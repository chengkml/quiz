package com.ck.quiz.baidupan.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BaiduPanDeleteRequest {
    @NotEmpty(message = "删除路径不能为空")
    private List<String> paths;
}
