package com.ck.quiz.calendar.dto;

import com.ck.quiz.calendar.entity.CalendarEvent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 日程创建 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventCreateDto {

    /**
     * 标题
     */
    @NotBlank(message = "标题不能为空")
    private String title;

    /**
     * 描述
     */
    private String description;

    /**
     * 状态（可选，默认SCHEDULED）
     */
    private CalendarEvent.Status status = CalendarEvent.Status.SCHEDULED;

    /**
     * 开始时间
     */
    @NotNull(message = "开始时间不能为空")
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    @NotNull(message = "结束时间不能为空")
    private LocalDateTime endTime;

    /**
     * 是否全天
     */
    private Boolean allDay = Boolean.FALSE;
}
