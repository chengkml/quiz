package com.ck.quiz.calendar.dto;

import com.ck.quiz.calendar.entity.CalendarEvent;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 日程事件 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEventDto {

    /**
     * 事件唯一标识
     */
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
     * 地点
     */
    private String location;

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

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    private String createUser;

    /**
     * 创建人中文名
     */
    private String createUserName;

    /**
     * 更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    private String updateUser;
}
