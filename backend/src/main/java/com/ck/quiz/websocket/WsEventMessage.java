package com.ck.quiz.websocket;

import lombok.Builder;
import lombok.Data;

/**
 * WebSocket 事件消息对象
 * 定义通过 WebSocket 推送的事件消息的数据结构
 * 包含事件类型、业务信息、响应动作等完整信息
 */
@Data
@Builder
public class WsEventMessage {

    /** 事件类型 */
    private WsEventType type;

    /** 事件唯一标识符 */
    private String eventId;

    /** 业务类型 */
    private WsBizType bizType;

    /** 业务实体的 ID */
    private String bizId;

    /** 客户端响应的动作 */
    private WsAction action;

    /** 事件级别（如：INFO、WARNING、ERROR、SUCCESS 等） */
    private String level;

    /** 事件发生的时间戳（毫秒） */
    private Long timestamp;
}
