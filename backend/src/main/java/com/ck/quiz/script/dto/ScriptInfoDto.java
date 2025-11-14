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
     * 脚本类型（python/shell/node/java/...）
     */
    private String scriptType;

    /**
     * 执行入口文件
     */
    private String execEntry;

    /**
     * 脚本文件或目录路径
     */
    private String filePath;

    /**
     * 自定义执行命令模板
     */
    private String execCmd;

    /**
     * 脚本描述
     */
    private String description;

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