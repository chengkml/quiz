package com.ck.quiz.notification.service.impl;

import org.springframework.stereotype.Component;

import com.ck.quiz.notification.service.NotificationChannel;
import com.ck.quiz.notification.service.NotificationChannelType;
import com.ck.quiz.notification.service.NotificationMessage;

@Component
public class SmsChannel implements NotificationChannel {

    @Override
    public NotificationChannelType getType() {
        return NotificationChannelType.SMS;
    }

    @Override
    public boolean send(NotificationMessage message) {
        // 调对接短信服务商的 SDK
        System.out.println("Sending SMS to " + message.getTo());
        System.out.println("Content: " + message.getContent());
        return true;
    }
}
