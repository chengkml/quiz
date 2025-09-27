package com.ck.quiz.role.exception;

import lombok.Data;

/**
 * 角色管理模块自定义异常
 */
@Data
public class RoleException extends RuntimeException {

    private String code;

    public RoleException(String code, String message) {
        super(message);
        this.code = code;
    }

}