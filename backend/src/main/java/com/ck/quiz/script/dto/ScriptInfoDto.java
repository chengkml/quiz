package com.ck.quiz.script.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 脚本信息DTO
 */
@Data
public class ScriptInfoDto {

    /**
     * 主键ID
     */
    private String id;

    /**
     * 脚本编码（唯一标识）
     */
    private String scriptCode;

    /**
     * 脚本名称
     */
    private String scriptName;

    /**
     * 远程脚本
     */
    private String remoteScript;

    /**
     * 远程脚本主机
     */
    private String host;

    /**
     * 远程主机端口
     */
    private Integer port;

    /**
     * 远程主机用户名
     */
    private String username;

    /**
     * 远程主机密码
     */
    private String password;

    /**
     * 自定义执行命令模板
     */
    private String execCmd;

    /**
     * 启用状态
     */
    private String state;

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    private String createUser;

    /**
     * 更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    private String updateUser;
}