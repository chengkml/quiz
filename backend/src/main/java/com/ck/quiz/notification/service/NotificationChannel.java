package com.ck.quiz.notification.service;

public interface NotificationChannel {

    NotificationChannelType getType();

    void send(NotificationMessage message);
}
