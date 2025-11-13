package com.ck.quiz.script.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import javax.validation.constraints.Size;

/**
 * 脚本任务创建DTO
 */
@Data
public class ScriptTaskCreateDto {

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
}