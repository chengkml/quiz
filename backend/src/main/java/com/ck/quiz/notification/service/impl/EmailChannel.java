package com.ck.quiz.notification.service.impl;

import org.springframework.stereotype.Component;

import com.ck.quiz.notification.service.NotificationChannel;
import com.ck.quiz.notification.service.NotificationChannelType;
import com.ck.quiz.notification.service.NotificationMessage;

@Component
public class EmailChannel implements NotificationChannel {

    @Override
    public NotificationChannelType getType() {
        return NotificationChannelType.EMAIL;
    }

    @Override
    public boolean send(NotificationMessage message) {
        // 使用 JavaMailSender 示例
        try {
            // 发送邮件逻辑
            System.out.println("Sending Email to " + message.getTo());
            System.out.println("Title: " + message.getTitle());
            System.out.println("Content: " + message.getContent());
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
