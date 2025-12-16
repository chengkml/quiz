package com.ck.quiz.calendar.dto;

import com.ck.quiz.calendar.entity.CalendarEvent;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 日程更新 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventUpdateDto {

    /**
     * 事件唯一标识
     */
    @NotBlank(message = "事件ID不能为空")
    private String id;

    /**
     * 标题
     */
    private String title;

    /**
     * 描述
     */
    private String description;

    /**
     * 状态
     */
    private CalendarEvent.Status status;

    /**
     * 开始时间
     */
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    private LocalDateTime endTime;

    /**
     * 是否全天
     */
    private Boolean allDay;
}
