package com.ck.quiz.script.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import javax.validation.constraints.Size;

/**
 * 脚本任务执行DTO
 */
@Data
public class ScriptTaskExecuteDto {

    /**
     * 脚本ID
     */
    @NotBlank(message = "脚本ID不能为空")
    @Size(max = 32, message = "脚本ID长度不能超过32个字符")
    private String scriptId;

    /**
     * 输入参数（JSON格式）
     */
    private String inputParams;

    /**
     * 是否异步执行（true: 异步, false: 同步）
     */
    private Boolean async = true;

    /**
     * 超时时间（毫秒）
     */
    private Long timeoutMs;
}