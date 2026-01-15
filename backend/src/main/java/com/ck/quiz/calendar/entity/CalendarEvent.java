package com.ck.quiz.calendar.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import org.hibernate.annotations.Comment;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

@Entity
@Comment("日程事件实体")
@Table(name = "calendar_event", indexes = {
        @Index(name = "idx_calendar_event_status", columnList = "status"),
        @Index(name = "idx_calendar_event_start", columnList = "start_time"),
        @Index(name = "idx_calendar_event_end", columnList = "end_time"),
        @Index(name = "idx_calendar_event_create_date", columnList = "create_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEvent {

    @Id
    @Comment("事件ID")
    @Column(name = "event_id", length = 32, nullable = false)
    private String id;

    @Comment("标题")
    @Column(name = "title", length = 256, nullable = false)
    private String title;

    @Comment("描述")
    @Lob
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Comment("状态：SCHEDULED, COMPLETED, CANCELLED")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.SCHEDULED;

    @Comment("开始时间")
    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Comment("结束时间")
    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Comment("是否全天")
    @Column(name = "all_day")
    private Boolean allDay = Boolean.FALSE;

    @Comment("创建时间")
    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    @Comment("创建人")
    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    @Comment("更新时间")
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    @Comment("更新人")
    @Column(name = "update_user", length = 64)
    private String updateUser;

    @Comment("完成时间")
    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.createUser = authentication.getName();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.updateUser = authentication.getName();
        }
    }

    public enum Status {
        SCHEDULED,
        COMPLETED,
        CANCELLED
    }
}
