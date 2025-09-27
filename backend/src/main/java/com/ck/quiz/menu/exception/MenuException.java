package com.ck.quiz.menu.exception;

import lombok.Data;

/**
 * 菜单管理模块自定义异常
 */
@Data
public class MenuException extends RuntimeException {

    private String code;

    public MenuException(String code, String message) {
        super(message);
        this.code = code;
    }

}