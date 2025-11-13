package com.ck.quiz.cron.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import javax.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.Date;

/**
 * JobQueue DTO，用于数据传输
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
public class JobQueueDto {

    /**
     * id
     */
    private String id;

    /**
     * 队列名
     */
    @NotBlank(message = "队列名不能为空")
    private String queueName;

    /**
     * 队列中文名
     */
    private String queueLabel;

    /**
     * 队列大小
     */
    @Min(value = 0, message = "队列大小不能为负数")
    private int queueSize;

    /**
     * 队列状态
     */
    private String state;

    private LocalDateTime createTime;
}
