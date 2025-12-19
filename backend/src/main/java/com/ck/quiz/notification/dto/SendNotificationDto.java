package com.ck.quiz.notification.dto;

import lombok.Data;

import java.util.List;

/**
 * 发送系统消息请求DTO
 */
@Data
public class SendNotificationDto {

    /**
     * 接收用户ID列表（为空时发送给所有用户）
     */
    private List<String> userIds;

    /**
     * 消息标题
     */
    private String title;

    /**
     * 消息内容
     */
    private String content;

    /**
     * 消息类型：INFO, WARNING, ERROR, SUCCESS
     */
    private String type = "INFO";

    /**
     * 消息优先级：LOW, NORMAL, HIGH
     */
    private String priority = "NORMAL";

    /**
     * 关联链接（可选）
     */
    private String linkUrl;
}
