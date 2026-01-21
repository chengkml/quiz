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

    @NotNull(message = "开始时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    @NotNull(message = "结束时间不能为空")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime endTime;

    private Boolean allDay = Boolean.FALSE;
}
