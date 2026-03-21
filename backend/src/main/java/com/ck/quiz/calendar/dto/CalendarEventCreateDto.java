package com.ck.quiz.calendar.dto;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.calendar.entity.CalendarEvent;
import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class CalendarEventCreateDto extends CreateDto {

    @NotBlank(message = "标题不能为空")
    private String title;

    private String descr;

    private CalendarEvent.Status status = CalendarEvent.Status.SCHEDULED;

    private CalendarEvent.Priority priority = CalendarEvent.Priority.MEDIUM;

    @NotNull(message = "开始时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    @NotNull(message = "结束时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endTime;

    private LocalDateTime expireTime;

    private Boolean allDay = Boolean.FALSE;

    /**
     * 是否为同步创建（防止循环调用）
     */
    private Boolean isSync = false;

    /**
     * 关联的待办ID（同步创建时传入）
     */
    private String todoId;
}
