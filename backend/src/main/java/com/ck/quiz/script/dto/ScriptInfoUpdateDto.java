package com.ck.quiz.script.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import javax.validation.constraints.Size;

/**
 * 脚本信息更新DTO
 */
@Data
public class ScriptInfoUpdateDto {

    /**
     * 主键ID
     */
    @NotBlank(message = "主键ID不能为空")
    @Size(max = 32, message = "主键ID长度不能超过32个字符")
    private String id;

    /**
     * 脚本名称
     */
    @Size(max = 128, message = "脚本名称长度不能超过128个字符")
    private String scriptName;

    /**
     * 脚本类型（python/shell/node/java/...）
     */
    @Size(max = 32, message = "脚本类型长度不能超过32个字符")
    private String scriptType;

    /**
     * 执行入口文件
     */
    @Size(max = 256, message = "执行入口文件长度不能超过256个字符")
    private String execEntry;

    /**
     * 脚本文件或目录路径
     */
    @Size(max = 512, message = "脚本文件路径长度不能超过512个字符")
    private String filePath;

    /**
     * 自定义执行命令模板
     */
    @Size(max = 512, message = "自定义执行命令长度不能超过512个字符")
    private String execCmd;

    /**
     * 脚本描述
     */
    private String description;

    /**
     * 启用状态
     */
    @Size(max = 20, message = "状态长度不能超过20个字符")
    private String state;
}