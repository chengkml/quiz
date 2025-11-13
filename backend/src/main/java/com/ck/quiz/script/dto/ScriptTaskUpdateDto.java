package com.ck.quiz.script.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import javax.validation.constraints.Size;

/**
 * 脚本任务更新DTO
 */
@Data
public class ScriptTaskUpdateDto {

    /**
     * 主键ID
     */
    @NotBlank(message = "主键ID不能为空")
    @Size(max = 32, message = "主键ID长度不能超过32个字符")
    private String id;

    /**
     * 执行状态
     */
    @Size(max = 20, message = "状态长度不能超过20个字符")
    private String status;

    /**
     * 执行开始时间
     */
    private java.time.LocalDateTime startTime;

    /**
     * 执行结束时间
     */
    private java.time.LocalDateTime endTime;

    /**
     * 执行耗时（毫秒）
     */
    private Long durationMs;

    /**
     * 输出结果
     */
    private String outputResult;

    /**
     * 退出码
     */
    private Integer exitCode;

    /**
     * 错误信息
     */
    private String errorMessage;

    /**
     * 日志文件路径
     */
    @Size(max = 512, message = "日志文件路径长度不能超过512个字符")
    private String logPath;
}