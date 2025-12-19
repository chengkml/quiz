package com.ck.quiz.websocket;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * WebSocket 消息服务
 * 提供推送消息的核心功能
 * 支持广播消息（一对多）和单用户消息（一对一）两种推送方式
 */
@Service
public class WsMessageService {

    /** Spring 提供的 STOMP 消息模板，用于发送消息 */
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * 按主题广播消息
     * 向订阅了指定主题的所有客户端发送消息
     * 
     * @param topic 主题名称，不包含 /topic/ 前缀
     * @param payload 消息内容
     */
    public void sendToTopic(String topic, Object payload) {
        messagingTemplate.convertAndSend("/topic/" + topic, payload);
    }

    /**
     * 向指定用户发送消息
     * 只有该用户的连接会收到此消息
     * 
     * @param userId 目标用户 ID
     * @param destination 消息目标地址，不包含 /queue/ 前缀
     * @param payload 消息内容
     */
    public void sendToUser(String userId, String destination, Object payload) {
        messagingTemplate.convertAndSendToUser(
                userId,
                "/queue/" + destination,
                payload
        );
    }
}
