package com.ck.quiz.script.dto;

import lombok.Data;
import javax.validation.constraints.Size;

/**
 * 脚本信息查询DTO
 */
@Data
public class ScriptInfoQueryDto {

    /**
     * 脚本编码
     */
    @Size(max = 64, message = "脚本编码长度不能超过64个字符")
    private String scriptCode;

    /**
     * 脚本名称
     */
    @Size(max = 128, message = "脚本名称长度不能超过128个字符")
    private String scriptName;

    /**
     * 脚本类型
     */
    @Size(max = 32, message = "脚本类型长度不能超过32个字符")
    private String scriptType;

    /**
     * 启用状态
     */
    @Size(max = 20, message = "状态长度不能超过20个字符")
    private String state;

    /**
     * 分页参数 - 当前页码
     */
    private Integer pageNum = 1;

    /**
     * 分页参数 - 每页条数
     */
    private Integer pageSize = 10;
}