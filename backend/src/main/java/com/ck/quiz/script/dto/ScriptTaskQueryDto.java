package com.ck.quiz.script.dto;

import lombok.Data;
import javax.validation.constraints.Size;
import java.time.LocalDateTime;

/**
 * 脚本任务查询DTO
 */
@Data
public class ScriptTaskQueryDto {

    /**
     * 任务唯一编码
     */
    @Size(max = 64, message = "任务编码长度不能超过64个字符")
    private String taskCode;

    /**
     * 脚本ID
     */
    @Size(max = 32, message = "脚本ID长度不能超过32个字符")
    private String scriptId;

    /**
     * 执行状态
     */
    @Size(max = 20, message = "状态长度不能超过20个字符")
    private String status;

    /**
     * 创建开始时间
     */
    private LocalDateTime createDateStart;

    /**
     * 创建结束时间
     */
    private LocalDateTime createDateEnd;

    /**
     * 执行开始时间
     */
    private LocalDateTime startTimeStart;

    /**
     * 执行结束时间
     */
    private LocalDateTime startTimeEnd;

    /**
     * 分页参数 - 当前页码
     */
    private Integer pageNum = 1;

    /**
     * 分页参数 - 每页条数
     */
    private Integer pageSize = 10;
}