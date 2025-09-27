package com.ck.quiz.role.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 角色管理模块全局异常处理器
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.ck.quiz.role")
public class RoleExceptionHandler {

    /**
     * 处理菜单管理业务异常
     */
    @ExceptionHandler(RoleException.class)
    public ResponseEntity<Map<String, Object>> handleMenuException(RoleException e) {
        log.error("角色管理异常: code={}, message={}", e.getCode(), e.getMessage());

        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("errorCode", e.getCode());
        body.put("errorMessage", e.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

}
