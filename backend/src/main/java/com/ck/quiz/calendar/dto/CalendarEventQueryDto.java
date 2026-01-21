package com.ck.quiz.calendar.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.calendar.entity.CalendarEvent;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class CalendarEventQueryDto extends QueryDto {

    private String title;

    private CalendarEvent.Status status;

    private LocalDateTime startTimeFrom;

    private LocalDateTime startTimeTo;
}
