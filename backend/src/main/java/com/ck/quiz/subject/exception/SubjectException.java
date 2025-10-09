package com.ck.quiz.subject.exception;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 学科管理模块自定义异常
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class SubjectException extends RuntimeException {

    private String code;

    public SubjectException(String code, String message) {
        super(message);
        this.code = code;
    }

}