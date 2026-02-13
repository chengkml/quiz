package com.ck.quiz.calendar.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.calendar.entity.CalendarEvent;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class CalendarEventDto extends Dto {

    private String title;

    private String descr;

    private CalendarEvent.Status status;

    private CalendarEvent.Priority priority;

    private LocalDateTime startTime;

    private LocalDateTime endTime;

    private Boolean allDay;

    private LocalDateTime completedAt;

    private String todoId;
}
