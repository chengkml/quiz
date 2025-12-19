package com.ck.quiz.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 系统消息DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemMessageDto {

    /**
     * 消息ID
     */
    private String id;

    /**
     * 接收用户ID
     */
    private String userId;

    /**
     * 消息标题
     */
    private String title;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 消息类型
     */
    private String type;

    /**
     * 是否已读
     */
    private Boolean isRead;

    /**
     * 读取时间
     */
    private LocalDateTime readDate;

    /**
     * 消息优先级
     */
    private String priority;

    /**
     * 消息状态
     */
    private String status;

    /**
     * 发送人ID
     */
    private String senderId;

    /**
     * 关联链接
     */
    private String linkUrl;

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 过期时间
     */
    private LocalDateTime expireDate;
}
