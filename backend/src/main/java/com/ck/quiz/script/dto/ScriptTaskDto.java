package com.ck.quiz.script.dto;

import lombok.Data;
import java.time.LocalDateTime;

/**
 * 脚本任务DTO
 */
@Data
public class ScriptTaskDto {

    /**
     * 主键ID
     */
    private String id;

    /**
     * 任务唯一编码
     */
    private String taskCode;

    /**
     * 脚本ID
     */
    private String scriptId;

    /**
     * 脚本名称
     */
    private String scriptName;

    /**
     * 执行状态（pending/running/success/failed）
     */
    private String status;

    /**
     * 执行开始时间
     */
    private LocalDateTime startTime;

    /**
     * 执行结束时间
     */
    private LocalDateTime endTime;

    /**
     * 执行耗时（毫秒）
     */
    private Long durationMs;

    /**
     * 输入参数（JSON）
     */
    private String inputParams;

    /**
     * 输出结果（JSON）
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
    private String logPath;

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