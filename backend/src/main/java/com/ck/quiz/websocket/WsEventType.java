package com.ck.quiz.websocket;

/**
 * WebSocket 事件类型枚举
 * 定义系统中通过 WebSocket 推送的各类事件类型
 * 用于区分不同业务场景的实时通知
 */
public enum WsEventType {
    /** 新系统消息 - 系统级通知消息 */
    SYS_MSG_NEW,
    
    /** 业务事件 - 与业务逻辑相关的事件 */
    BIZ_EVENT,
    
    /** 强制下线 - 用户登录状态失效，需要重新登录 */
    FORCE_LOGOUT,
    
    /** 任务完成 - 后台任务执行完毕 */
    TASK_DONE,
    
    /** 数据刷新 - 需要刷新客户端的数据 */
    DATA_REFRESH
}

