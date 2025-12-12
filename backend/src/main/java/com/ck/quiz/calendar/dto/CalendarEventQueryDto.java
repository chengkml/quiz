package com.ck.quiz.calendar.dto;

import com.ck.quiz.calendar.entity.CalendarEvent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 日程查询 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventQueryDto {

    /**
     * 标题关键字（模糊）
     */
    private String title;

    /**
     * 状态
     */
    private CalendarEvent.Status status;

    /**
     * 开始时间起
     */
    private LocalDateTime startTimeFrom;

    /**
     * 开始时间止
     */
    private LocalDateTime startTimeTo;

    /**
     * 当前页码，从0开始
     */
    private Integer pageNum = 0;

    /**
     * 每页显示条数
     */
    private Integer pageSize = 20;

    /**
     * 排序字段
     */
    private String sortColumn = "start_time";

    /**
     * 排序方式，asc 或 desc
     */
    private String sortType = "asc";
}
