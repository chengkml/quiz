package com.ck.quiz.prompt.exception;

/**
 * 提示词模板异常类
 * 用于处理提示词模板相关的业务异常
 */
public class PromptTemplateException extends RuntimeException {

    private String code;

    public PromptTemplateException(String code, String message) {
        super(message);
        this.code = code;
    }

    public PromptTemplateException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}