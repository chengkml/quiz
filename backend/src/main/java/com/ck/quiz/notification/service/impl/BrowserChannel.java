package com.ck.quiz.notification.service.impl;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.ck.quiz.notification.entity.SystemMessage;
import com.ck.quiz.notification.repository.SystemMessageRepository;
import com.ck.quiz.notification.service.NotificationChannel;
import com.ck.quiz.notification.service.NotificationChannelType;
import com.ck.quiz.notification.service.NotificationMessage;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.websocket.WsAction;
import com.ck.quiz.websocket.WsBizType;
import com.ck.quiz.websocket.WsEventMessage;
import com.ck.quiz.websocket.WsEventType;
import com.ck.quiz.websocket.WsMessageService;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class BrowserChannel implements NotificationChannel {

    @Autowired
    private SystemMessageRepository messageRepository;

    @Autowired
    private WsMessageService wsMessageService;

    @Override
    public NotificationChannelType getType() {
        return NotificationChannelType.BROWSER;
    }

    @Override
    public void send(NotificationMessage message) {

        String messageId = IdHelper.genUuid();
        SystemMessage insertMsg = SystemMessage.builder()
                .id(messageId)
                .userId(message.getTo())
                .title(message.getTitle())
                .content(message.getContent())
                .type(SystemMessage.MessageType.valueOf(message.getType().toUpperCase()))
                .isRead(false)
                .priority(SystemMessage.MessagePriority.NORMAL)
                .status(SystemMessage.MessageStatus.ACTIVE)
                .senderId(message.getSenderId())
                .createDate(LocalDateTime.now())
                .build();

        messageRepository.save(insertMsg);
        log.info("系统消息已发送，messageId: {}, userId: {}", messageId, message.getTo());
        WsEventMessage wsMsg = WsEventMessage.builder()
                .type(WsEventType.SYS_MSG_NEW)
                .eventId(messageId)
                .bizType(WsBizType.SYSTEM)
                .bizId(null)
                .action(WsAction.BADGE)
                .level("INFO")
                .timestamp(System.currentTimeMillis())
                .build();
        wsMessageService.sendToUser(message.getTo(), "sys_msg", wsMsg);
        log.info("浏览器消息已推送，userId: {}", message.getTo());
    }
}
