package com.ck.quiz.script.dto;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 脚本任务日志查询DTO
 */
@Data
public class ScriptTaskLogQueryDto implements Serializable {
    
    private static final long serialVersionUID = 1L;
    
    /**
     * 页码
     */
    private Integer pageNum;
    
    /**
     * 每页数量
     */
    private Integer pageSize;
    
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
     */
    private String executionStatus;
    
    /**
     * 执行开始时间起
     */
    private LocalDateTime startTimeBegin;
    
    /**
     * 执行开始时间止
     */
    private LocalDateTime startTimeEnd;
    
    /**
     * 执行结束时间起
     */
    private LocalDateTime endTimeBegin;
    
    /**
     * 执行结束时间止
     */
    private LocalDateTime endTimeEnd;
    
    /**
     * 排序字段
     */
    private String orderBy;
    
    /**
     * 排序方向
     */
    private String orderDirection;
}