package com.ck.quiz.subject.exception;

import lombok.Data;

/**
 * 学科管理模块自定义异常
 */
@Data
public class SubjectException extends RuntimeException {

    private String code;

    public SubjectException(String code, String message) {
        super(message);
        this.code = code;
    }

}