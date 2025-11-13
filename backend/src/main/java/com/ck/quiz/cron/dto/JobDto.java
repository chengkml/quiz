package com.ck.quiz.cron.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;


/**
 * Job DTO，用于数据传输
 */
@Data
@NoArgsConstructor
public class JobDto {

    @NotBlank(message = "任务执行类不能为空")
    private String taskClass;

    private String taskParams;

    @NotBlank(message = "队列名不能为空")
    private String queueName;

    private int priority = 0;

}
