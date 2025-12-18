package com.ck.quiz.calendar.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 日程完成 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventCompleteDto {

    /**
     * 事件唯一标识
     */
    @NotBlank(message = "事件ID不能为空")
    private String id;

    /**
     * 完成时间（可选，默认为当前时间）
     */
    private LocalDateTime completedAt;
}
