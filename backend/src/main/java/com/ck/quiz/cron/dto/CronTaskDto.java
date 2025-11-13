package com.ck.quiz.cron.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * CronTask DTO，用于数据传输
 */
@Data
@NoArgsConstructor
public class CronTaskDto {

    private String id;

    @NotBlank(message = "任务名称不能为空")
    private String name;

    private String label;

    private String nextFireTime;

    /**
     * cron 表达式
     */
    private String cronExpression;

    /**
     * 是否启用
     */
    private String state;

    /**
     * 执行类
     */
    @NotBlank(message = "任务执行类不能为空")
    private String taskClass;

    /**
     * 扩展属性（JSON 等）
     */
    private String fireParams = "{}";

    private String queueName;

}
