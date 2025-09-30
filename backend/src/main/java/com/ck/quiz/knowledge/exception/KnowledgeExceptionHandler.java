package com.ck.quiz.knowledge.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 知识模块全局异常处理器
 * 用于处理知识相关的异常并返回统一的错误响应
 */
@Slf4j
@RestControllerAdvice
public class KnowledgeExceptionHandler {

    /**
     * 处理知识模块自定义异常
     *
     * @param ex 知识异常
     * @return 错误响应
     */
    @ExceptionHandler(KnowledgeException.class)
    public ResponseEntity<Map<String, Object>> handleKnowledgeException(KnowledgeException ex) {
        log.error("知识模块异常: code={}, message={}", ex.getCode(), ex.getMessage(), ex);

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("errorCode", ex.getCode());
        response.put("errorMessage", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

}