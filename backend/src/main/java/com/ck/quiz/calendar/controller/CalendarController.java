package com.ck.quiz.calendar.controller;

import com.ck.quiz.calendar.dto.CalendarEventCreateDto;
import com.ck.quiz.calendar.dto.CalendarEventDto;
import com.ck.quiz.calendar.dto.CalendarEventQueryDto;
import com.ck.quiz.calendar.dto.CalendarEventUpdateDto;
import com.ck.quiz.calendar.service.CalendarEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 日程管理接口
 */
@Tag(name = "日程管理", description = "日程事件的创建、更新、删除、查询等接口")
@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    @Autowired
    private CalendarEventService calendarEventService;

    @Operation(summary = "创建日程", description = "创建一个新的日程事件")
    @PostMapping("/create")
    public ResponseEntity<CalendarEventDto> createEvent(
            @Parameter(description = "日程创建信息", required = true)
            @Valid @RequestBody CalendarEventCreateDto dto) {
        return ResponseEntity.ok(calendarEventService.createEvent(dto));
    }

    @Operation(summary = "更新日程", description = "更新指定的日程事件信息")
    @PutMapping("/update")
    public ResponseEntity<CalendarEventDto> updateEvent(
            @Parameter(description = "日程更新信息", required = true)
            @Valid @RequestBody CalendarEventUpdateDto dto) {
        return ResponseEntity.ok(calendarEventService.updateEvent(dto));
    }

    @Operation(summary = "删除日程", description = "根据ID删除指定的日程事件")
    @DeleteMapping("/{eventId}")
    public ResponseEntity<Void> deleteEvent(
            @Parameter(description = "事件ID", required = true)
            @PathVariable String eventId) {
        calendarEventService.deleteEvent(eventId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "获取日程详情", description = "根据ID获取日程事件详细信息")
    @GetMapping("/{eventId}")
    public ResponseEntity<CalendarEventDto> getEventById(
            @Parameter(description = "事件ID", required = true)
            @PathVariable String eventId) {
        return ResponseEntity.ok(calendarEventService.getEventById(eventId));
    }

    @Operation(summary = "分页查询日程事件", description = "根据条件分页查询日程事件列表")
    @PostMapping("/search")
    public ResponseEntity<Page<CalendarEventDto>> searchEvents(
            @Parameter(description = "查询条件") @Valid @RequestBody CalendarEventQueryDto queryDto) {
        return ResponseEntity.ok(calendarEventService.searchEvents(queryDto));
    }
}
