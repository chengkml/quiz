package com.ck.quiz.knowledge.exception;

import lombok.Getter;

/**
 * 知识模块自定义异常
 * 用于知识相关业务异常的处理
 */
@Getter
public class KnowledgeException extends RuntimeException {

    /**
     * 错误代码
     */
    private final String code;

    /**
     * 构造函数
     *
     * @param code 错误代码
     * @param message 错误信息
     */
    public KnowledgeException(String code, String message) {
        super(message);
        this.code = code;
    }

    /**
     * 构造函数
     *
     * @param code 错误代码
     * @param message 错误信息
     * @param cause 原因异常
     */
    public KnowledgeException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

}