package com.ck.quiz.menu.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 菜单管理模块全局异常处理器
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.ck.quiz.menu")
public class MenuExceptionHandler {

    /**
     * 处理菜单管理业务异常
     */
    @ExceptionHandler(MenuException.class)
    public ResponseEntity<Map<String, Object>> handleMenuException(MenuException e) {
        log.error("菜单管理异常: code={}, message={}", e.getCode(), e.getMessage());

        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("errorCode", e.getCode());
        body.put("errorMessage", e.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

}
