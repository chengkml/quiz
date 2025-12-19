package com.ck.quiz.websocket;

/**
 * WebSocket 消息响应动作枚举
 * 定义客户端收到 WebSocket 消息后的处理动作
 * 用于指导前端如何响应后端推送的事件
 */
public enum WsAction {
    /** 刷新数据 - 重新加载相关数据 */
    REFRESH,

    /** 跳转页面 - 进行页面重定向 */
    REDIRECT,

    /** 弹窗 - 显示提示框或对话框 */
    POPUP,

    /** 徽章/数量提示 - 更新红点或数量提示 */
    BADGE,

    /** 静默处理 - 仅后台处理，不进行UI更新 */
    SILENT
}
