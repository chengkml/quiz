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
     * 远程脚本
     */
    @NotBlank(message = "远程脚本不能为空")
    @Size(max = 32, message = "远程脚本长度不能超过32个字符")
    private String remoteScript;

    /**
     * 远程脚本主机
     */
    @Size(max = 128, message = "远程主机地址长度不能超过128个字符")
    private String host;

    /**
     * 远程主机端口
     */
    private Integer port;

    /**
     * 远程主机用户名
     */
    @Size(max = 64, message = "远程主机用户名长度不能超过64个字符")
    private String username;

    /**
     * 远程主机密码
     */
    @Size(max = 128, message = "远程主机密码长度不能超过128个字符")
    private String password;

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
    private String state = "ENABLED";
}