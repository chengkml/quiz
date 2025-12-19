package com.ck.quiz.notification.service;

import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationDispatcher {

    private final Map<NotificationChannelType, NotificationChannel> channelMap = new HashMap<>();

    public NotificationDispatcher(List<NotificationChannel> channels) {
        channels.forEach(c -> channelMap.put(c.getType(), c));
    }

    public boolean dispatch(NotificationMessage message) {
        NotificationChannel channel = channelMap.get(message.getChannelType());
        if (channel == null) {
            throw new IllegalArgumentException("No channel found: " + message.getChannelType());
        }

        return channel.send(message);
    }
}
