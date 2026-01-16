package com.ck.quiz.mcp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class McpToolImportItemDto {

    @NotBlank(message = "原始名称不能为空")
    @Size(max = 128, message = "原始名称不能超过128个字符")
    private String originName;

    @NotBlank(message = "显示名称不能为空")
    @Size(max = 256, message = "显示名称不能超过256个字符")
    private String displayName;

    @Size(max = 512, message = "工具描述不能超过512个字符")
    private String description;

    @Size(max = 64, message = "分类不能超过64个字符")
    private String category;

    @Size(max = 512, message = "标签长度不能超过512个字符")
    private String tags;
}

