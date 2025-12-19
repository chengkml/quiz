package com.ck.quiz.websocket;

/**
 * WebSocket 业务类型枚举
 * 定义了 WebSocket 消息涉及的各种业务类型
 */
public enum WsBizType {
    /** 系统业务 */
    SYSTEM,

    /** 考试业务 */
    EXAM,

    /** 题目业务 */
    QUESTION,

    /** 考试排期/日程业务 */
    SCHEDULE,

    /** 任务业务 */
    TASK
}
