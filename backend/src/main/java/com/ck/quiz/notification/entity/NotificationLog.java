
package com.ck.quiz.notification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * 通知日志实体类
 */
@Entity
@Table(
    name = "notification_log",
    indexes = {
        @Index(name = "idx_notification_log_channel_type", columnList = "channel_type"),
        @Index(name = "idx_notification_log_created_at", columnList = "created_at")
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationLog {

    /**
     * 主键ID
     */
    @Id
    @Column(name = "id", nullable = false)
    private String id;

    /**
     * 通知渠道类型
     */
    @Column(name = "channel_type", length = 32, nullable = false)
    private String channelType;

    /**
     * 通知内容
     */
    @Lob
    @Column(name = "message_content", columnDefinition = "TEXT", nullable = false)
    private String messageContent;

    /**
     * 异常信息
     */
    @Lob
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * 日志级别（INFO, ERROR, WARN）
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "level", length = 20, nullable = false)
    private LogLevel level;

    /**
     * 创建时间
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /**
     * 日志级别枚举
     */
    public enum LogLevel {
        INFO,
        ERROR,
        WARN
    }

    /**
     * 构造方法，自动设置创建时间
     */
    public NotificationLog(String id, String channelType, String messageContent, String errorMessage) {
        this.id = id;
        this.channelType = channelType;
        this.messageContent = messageContent;
        this.errorMessage = errorMessage;
        this.level = LogLevel.ERROR;
        this.createdAt = LocalDateTime.now();
    }
}
