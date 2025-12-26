package com.ck.quiz.notification.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import com.ck.quiz.notification.repository.NotificationLogRepository;
import com.ck.quiz.notification.entity.NotificationLog;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationDispatcher {

    private final Map<NotificationChannelType, NotificationChannel> channelMap = new HashMap<>();
    private final NotificationLogRepository notificationLogRepository;

    @Autowired
    public NotificationDispatcher(List<NotificationChannel> channels, NotificationLogRepository notificationLogRepository) {
        channels.forEach(c -> channelMap.put(c.getType(), c));
        this.notificationLogRepository = notificationLogRepository;
    }

    public boolean dispatch(NotificationMessage message) {
        NotificationChannel channel = channelMap.get(message.getChannelType());
        if (channel == null) {
            // 记录异常到通知日志表
            NotificationLog log = new NotificationLog(
                String.valueOf(message.getChannelType()),
                message.toString(),
                "No channel found: " + message.getChannelType()
            );
            notificationLogRepository.save(log);
            throw new IllegalArgumentException("No channel found: " + message.getChannelType());
        }
        try {
            channel.send(message);
            return true;
        } catch (Exception e) {
            // 记录异常到通知日志表
            NotificationLog log = new NotificationLog(
                String.valueOf(message.getChannelType()),
                message.toString(),
                e.getMessage()
            );
            notificationLogRepository.save(log);
            throw e;
        }
    }
}
