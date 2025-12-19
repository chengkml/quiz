package com.ck.quiz.notification.service.impl;

import org.springframework.stereotype.Component;

import com.ck.quiz.notification.service.NotificationChannel;
import com.ck.quiz.notification.service.NotificationChannelType;
import com.ck.quiz.notification.service.NotificationMessage;

@Component
public class BrowserChannel implements NotificationChannel {

    @Override
    public NotificationChannelType getType() {
        return NotificationChannelType.BROWSER;
    }

    @Override
    public boolean send(NotificationMessage message) {
        return true;
    }
}
