package com.ck.quiz.calendar.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.calendar.dto.CalendarEventCreateDto;
import com.ck.quiz.calendar.dto.CalendarEventDto;
import com.ck.quiz.calendar.dto.CalendarEventQueryDto;
import com.ck.quiz.calendar.dto.CalendarEventUpdateDto;
import com.ck.quiz.calendar.entity.CalendarEvent;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface CalendarEventService extends BaseService<CalendarEventCreateDto, CalendarEventUpdateDto, CalendarEventQueryDto, CalendarEventDto, CalendarEvent> {

    SseEmitter streamGenerateEvent(String descr);

    CalendarEventDto complete(String userId, String eventId);
}
