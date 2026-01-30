package com.ck.quiz.notification.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 系统消息实体类
 */
@Entity
@Table(name = "system_message", indexes = {
        @Index(name = "idx_system_message_user_id", columnList = "user_id"),
        @Index(name = "idx_system_message_status", columnList = "status"),
        @Index(name = "idx_system_message_create_date", columnList = "create_date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemMessage {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id;

    /**
     * 接收用户ID
     */
    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;

    /**
     * 消息标题
     */
    @Column(name = "title", length = 256, nullable = false)
    private String title;

    /**
     * 消息内容
     */
    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    /**
     * 消息类型：INFO, WARNING, ERROR, SUCCESS
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 20, nullable = false)
    @Builder.Default
    private MessageType type = MessageType.INFO;

    /**
     * 是否已读
     */
    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    /**
     * 读取时间
     */
    @Column(name = "read_date")
    private LocalDateTime readDate;

    /**
     * 消息优先级：LOW, NORMAL, HIGH
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 20, nullable = false)
    @Builder.Default
    private MessagePriority priority = MessagePriority.NORMAL;

    /**
     * 消息状态：ACTIVE, DELETED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private MessageStatus status = MessageStatus.ACTIVE;

    /**
     * 发送人ID（系统消息时可为空或特殊值如"SYSTEM"）
     */
    @Column(name = "sender_id", length = 64)
    private String senderId;

    /**
     * 关联链接（可选）
     */
    @Column(name = "link_url", length = 512)
    private String linkUrl;

    /**
     * 创建时间
     */
    @Column(name = "create_date", nullable = false, updatable = false)
    private LocalDateTime createDate;

    /**
     * 过期时间（可选，为空时不过期）
     */
    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    /**
     * 消息类型枚举
     */
    public enum MessageType {
        INFO,
        WARNING,
        ERROR,
        SUCCESS
    }

    /**
     * 消息优先级枚举
     */
    public enum MessagePriority {
        LOW,
        NORMAL,
        HIGH
    }

    /**
     * 消息状态枚举
     */
    public enum MessageStatus {
        ACTIVE,
        DELETED
    }
}
