package com.ck.quiz.script.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import javax.validation.constraints.Size;

/**
 * 脚本信息创建DTO
 */
@Data
public class ScriptInfoCreateDto {

    /**
     * 脚本编码（唯一标识）
     */
    @NotBlank(message = "脚本编码不能为空")
    @Size(max = 64, message = "脚本编码长度不能超过64个字符")
    private String scriptCode;

    /**
     * 脚本名称
     */
    @NotBlank(message = "脚本名称不能为空")
    @Size(max = 128, message = "脚本名称长度不能超过128个字符")
    private String scriptName;

    /**
     * 脚本类型（python/shell/node/java/...）
     */
    @NotBlank(message = "脚本类型不能为空")
    @Size(max = 32, message = "脚本类型长度不能超过32个字符")
    private String scriptType;

    /**
     * 执行入口文件
     */
    @NotBlank(message = "执行入口文件不能为空")
    @Size(max = 256, message = "执行入口文件长度不能超过256个字符")
    private String execEntry;

    /**
     * 脚本文件或目录路径
     */
    @NotBlank(message = "脚本文件路径不能为空")
    @Size(max = 512, message = "脚本文件路径长度不能超过512个字符")
    private String filePath;

    /**
     * 脚本描述
     */
    private String description;

    /**
     * 启用状态
     */
    private String state = "ENABLED";
}