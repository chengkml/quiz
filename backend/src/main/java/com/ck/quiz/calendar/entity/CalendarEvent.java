package com.ck.quiz.calendar.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

@Data
@Entity
@Comment("日程事件实体")
@EqualsAndHashCode(callSuper = true)
@Table(name = "calendar_event", indexes = {
        @Index(name = "idx_calendar_event_status", columnList = "status"),
        @Index(name = "idx_calendar_event_priority", columnList = "priority"),
        @Index(name = "idx_calendar_event_start", columnList = "start_time"),
        @Index(name = "idx_calendar_event_end", columnList = "end_time")
})
public class CalendarEvent extends Model {

    @Column(length = 256, nullable = false)
    @Comment("标题")
    private String title;

    @Column(columnDefinition = "TEXT")
    @Comment("描述")
    private String descr;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("状态：SCHEDULED, COMPLETED, CANCELLED")
    private Status status = Status.SCHEDULED;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("优先级：LOW, MEDIUM, HIGH")
    private Priority priority = Priority.MEDIUM;

    @Column(nullable = false)
    @Comment("开始时间")
    private LocalDateTime startTime;

    @Column(nullable = false)
    @Comment("结束时间")
    private LocalDateTime endTime;

    @Comment("是否全天")
    private Boolean allDay = Boolean.FALSE;

    @Comment("完成时间")
    private LocalDateTime completedAt;

    public enum Status {
        SCHEDULED,
        IN_PROGRESS,
        COMPLETED,
        CANCELLED
    }

    public enum Priority {
        LOW,
        MEDIUM,
        HIGH
    }
}
