package com.ck.quiz.calendar.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.calendar.dto.CalendarEventCreateDto;
import com.ck.quiz.calendar.dto.CalendarEventDto;
import com.ck.quiz.calendar.dto.CalendarEventQueryDto;
import com.ck.quiz.calendar.dto.CalendarEventUpdateDto;
import com.ck.quiz.calendar.service.CalendarEventService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Tag(name = "日程管理", description = "日程事件的创建、更新、删除、查询等接口")
@RestController
@RequestMapping("/api/calendar")
public class CalendarController extends BaseController<CalendarEventCreateDto, CalendarEventUpdateDto, CalendarEventQueryDto, CalendarEventDto> {

    @Autowired
    private CalendarEventService calendarEventService;

    @Operation(summary = "流式生成日程（SSE）", description = "根据日程描述调用大模型流式生成日程信息")
    @GetMapping(path = "/generate/stream", produces = org.springframework.http.MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamGenerateEvent(
            @Parameter(description = "日程描述") @RequestParam("descr") String descr) {
        return calendarEventService.streamGenerateEvent(descr);
    }

    @Operation(summary = "完成日程", description = "根据日程ID标记日程为完成")
    @PostMapping("/{id}/complete")
    public ResponseEntity<CalendarEventDto> complete(
            @Parameter(description = "日程ID", required = true)
            @PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(calendarEventService.complete(authentication.getName(), id));
    }

    @Override
    protected BaseService<CalendarEventCreateDto, CalendarEventUpdateDto, CalendarEventQueryDto, CalendarEventDto, ?> getService() {
        return calendarEventService;
    }
}
