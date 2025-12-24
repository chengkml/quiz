package com.ck.quiz.websocket;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket 配置类
 * 配置 STOMP over WebSocket 的连接端点和消息代理
 * 使用 SockJS 提供向后兼容性，支持不支持 WebSocket 的浏览器
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * 注册 STOMP 端点
     * 配置 WebSocket 连接的端点地址为 /quiz-ws
     * 允许所有源的跨域请求
     * 使用 SockJS 进行兼容性处理
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/quiz-ws")
                .setAllowedOriginPatterns("*")
                .withSockJS(); // 使用 SockJS 提高浏览器兼容性
    }

    /**
     * 配置消息代理
     * 定义客户端和服务器之间的消息路由规则
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 启用简单的内存消息代理，处理 /topic 和 /queue 前缀的消息
        // /topic: 用于广播消息（一对多）
        // /queue: 用于点对点消息（一对一）
        registry.enableSimpleBroker("/topic", "/queue");

        // 设置应用程序目标前缀，客户端发送消息时使用 /app 前缀
        registry.setApplicationDestinationPrefixes("/app");

        // 设置用户目标前缀，用于发送指定用户的消息
        // 实际路由为 /user/{userId}/queue/{destination}
        registry.setUserDestinationPrefix("/user");
    }
}
