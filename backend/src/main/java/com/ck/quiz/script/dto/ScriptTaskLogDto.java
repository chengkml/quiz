package com.ck.quiz.script.dto;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 脚本任务日志DTO
 */
@Data
public class ScriptTaskLogDto implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 主键ID
     */
    private String id;
    
    /**
     * 任务ID
     */
    private String taskId;
    
    /**
     * 脚本ID
     */
    private String scriptId;
    
    /**
     * 脚本编码
     */
    private String scriptCode;
    
    /**
     * 执行状态
     * SUCCESS: 成功
     * FAILURE: 失败
     * RUNNING: 运行中
     */
    private String executionStatus;
    
    /**
     * 执行结果
     */
    private String executionResult;
    
    /**
     * 执行开始时间
     */
    private LocalDateTime startTime;
    
    /**
     * 执行结束时间
     */
    private LocalDateTime endTime;
    
    /**
     * 执行耗时(毫秒)
     */
    private Long executionTime;
    
    /**
     * 执行参数
     */
    private String executionParams;
    
    /**
     * 错误信息
     */
    private String errorMessage;
    
    /**
     * 创建时间
     */
    private LocalDateTime createTime;
    
    /**
     * 更新时间
     */
    private LocalDateTime updateTime;
}