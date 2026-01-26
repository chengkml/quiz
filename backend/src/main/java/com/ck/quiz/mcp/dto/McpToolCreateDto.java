package com.ck.quiz.mcp.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class McpToolCreateDto extends CreateDto {

    @NotBlank(message = "服务器ID不能为空")
    @Size(max = 32, message = "服务器ID不能超过32个字符")
    private String serverId;

    @NotBlank(message = "环境不能为空")
    @Size(max = 32, message = "环境不能超过32个字符")
    private String env;

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

    @Size(max = 8000, message = "Schema长度不能超过8000个字符")
    private String schemaJson;

    @Size(max = 8000, message = "策略长度不能超过8000个字符")
    private String strategyJson;

    @Size(max = 4000, message = "可见范围长度不能超过4000个字符")
    private String visibilityJson;
}

