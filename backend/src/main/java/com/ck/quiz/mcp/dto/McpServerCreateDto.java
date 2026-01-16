package com.ck.quiz.mcp.dto;

import com.ck.quiz.base.dto.CreateDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class McpServerCreateDto extends CreateDto {

    @NotBlank(message = "服务器名称不能为空")
    @Size(max = 128, message = "服务器名称不能超过128个字符")
    private String name;

    @NotBlank(message = "服务器标识不能为空")
    @Size(max = 128, message = "服务器标识不能超过128个字符")
    private String identifier;

    @Size(max = 512, message = "服务器描述不能超过512个字符")
    private String description;

    @NotBlank(message = "环境不能为空")
    @Size(max = 32, message = "环境不能超过32个字符")
    private String env;

    @NotBlank(message = "服务器地址不能为空")
    @Size(max = 512, message = "服务器地址不能超过512个字符")
    private String address;

    @NotBlank(message = "协议不能为空")
    @Size(max = 32, message = "协议不能超过32个字符")
    private String protocol;

    @NotBlank(message = "认证类型不能为空")
    @Size(max = 32, message = "认证类型不能超过32个字符")
    private String authType;

    @Size(max = 4000, message = "认证配置长度不能超过4000个字符")
    private String authConfig;
}

