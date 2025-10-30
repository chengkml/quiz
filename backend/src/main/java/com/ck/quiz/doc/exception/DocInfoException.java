package com.ck.quiz.doc.exception;

import lombok.Getter;

/**
 * 文档模块自定义异常类
 * 用于处理文档相关的业务异常
 */
@Getter
public class DocInfoException extends RuntimeException {

    /**
     * 异常代码
     */
    private final String code;

    /**
     * 构造函数
     *
     * @param code    异常代码
     * @param message 异常消息
     */
    public DocInfoException(String code, String message) {
        super(message);
        this.code = code;
    }

    /**
     * 构造函数
     *
     * @param code    异常代码
     * @param message 异常消息
     * @param cause   异常原因
     */
    public DocInfoException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }
}