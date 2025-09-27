package com.ck.quiz.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 维度管理模块全局异常处理器
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.ck.quiz")
public class CommonExceptionHandler {

    /**
     * 处理参数校验异常
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException e) {
        log.error("参数校验异常: {}", e.getMessage());

        String errorMessage = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));

        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("code", "VALIDATION_ERROR");
        result.put("message", "参数校验失败: " + errorMessage);

        return ResponseEntity.badRequest().body(result);
    }

    /**
     * 处理绑定异常
     */
    @ExceptionHandler(BindException.class)
    public ResponseEntity<Map<String, Object>> handleBindException(BindException e) {
        log.error("参数绑定异常: {}", e.getMessage());

        String errorMessage = e.getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));

        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("code", "BIND_ERROR");
        result.put("message", "参数绑定失败: " + errorMessage);

        return ResponseEntity.badRequest().body(result);
    }

    /**
     * 处理约束违反异常
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Map<String, Object>> handleConstraintViolationException(ConstraintViolationException e) {
        log.error("约束违反异常: {}", e.getMessage());

        String errorMessage = e.getConstraintViolations().stream()
                .map(ConstraintViolation::getMessage)
                .collect(Collectors.joining("; "));

        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("code", "CONSTRAINT_VIOLATION");
        result.put("message", "约束违反: " + errorMessage);

        return ResponseEntity.badRequest().body(result);
    }

    /**
     * 处理运行时异常
     */
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException e) {
        log.error("运行时异常: {}", e.getMessage(), e);

        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("code", "RUNTIME_ERROR");
        result.put("message", e.getMessage());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }

    /**
     * 处理其他异常
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception e) {
        log.error("系统异常: {}", e.getMessage(), e);

        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("code", "SYSTEM_ERROR");
        result.put("message", "系统内部错误");

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
    }

}