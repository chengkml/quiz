package com.ck.quiz.calendar.service;

import com.ck.quiz.calendar.dto.CalendarEventCreateDto;
import com.ck.quiz.calendar.dto.CalendarEventDto;
import com.ck.quiz.calendar.dto.CalendarEventQueryDto;
import com.ck.quiz.calendar.dto.CalendarEventUpdateDto;
import com.ck.quiz.calendar.entity.CalendarEvent;
import org.springframework.data.domain.Page;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * 日程管理服务接口
 */
public interface CalendarEventService {

    /**
     * 创建事件
     */
    CalendarEventDto createEvent(CalendarEventCreateDto createDto);

    /**
     * 流式生成事件内容
     */
    SseEmitter streamGenerateEvent(String descr);

    /**
     * 更新事件
     */
    CalendarEventDto updateEvent(CalendarEventUpdateDto updateDto);

    /**
     * 删除事件
     */
    CalendarEventDto deleteEvent(String eventId);

    /**
     * 获取事件详情
     */
    CalendarEventDto getEventById(String eventId);

    /**
     * 分页查询事件
     */
    Page<CalendarEventDto> searchEvents(CalendarEventQueryDto queryDto);

    /**
     * 实体转 DTO
     */
    CalendarEventDto convertToDto(CalendarEvent calendarEvent);
    
}
