package com.ck.quiz.notification.service;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class NotificationMessage {

    private NotificationChannelType channelType;

    private String to; // 手机号 / email / userId / URL
    private String title; // 邮件/浏览器消息标题
    private String content; // 渲染后的内容（短信内容等）
}
