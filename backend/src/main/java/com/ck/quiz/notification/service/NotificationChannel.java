package com.ck.quiz.notification.service;

public interface NotificationChannel {

    NotificationChannelType getType();

    boolean send(NotificationMessage message);
}
