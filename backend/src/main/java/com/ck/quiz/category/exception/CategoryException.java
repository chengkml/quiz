package com.ck.quiz.category.exception;

import lombok.Getter;

/**
 * 分类模块自定义异常类
 * 用于处理分类相关的业务异常
 */
@Getter
public class CategoryException extends RuntimeException {

    /**
     * 异常代码
     */
    private final String code;

    /**
     * 构造函数
     *
     * @param code 异常代码
     * @param message 异常消息
     */
    public CategoryException(String code, String message) {
        super(message);
        this.code = code;
    }

    /**
     * 构造函数
     *
     * @param code 异常代码
     * @param message 异常消息
     * @param cause 异常原因
     */
    public CategoryException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

}