package com.ck.quiz.prompt.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 提示词模板异常处理器
 * 用于统一处理提示词模板相关的异常
 */
@RestControllerAdvice
@Slf4j
public class PromptTemplateExceptionHandler {

    /**
     * 处理提示词模板异常
     *
     * @param e 提示词模板异常
     * @return 错误响应
     */
    @ExceptionHandler(PromptTemplateException.class)
    public ResponseEntity<Map<String, Object>> handlePromptTemplateException(PromptTemplateException e) {
        log.error("提示词模板异常: {}", e.getMessage(), e);
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("code", e.getCode());
        errorResponse.put("message", e.getMessage());
        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(errorResponse);
    }
}