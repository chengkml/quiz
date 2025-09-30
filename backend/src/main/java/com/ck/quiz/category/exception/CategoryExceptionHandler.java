package com.ck.quiz.category.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 分类模块全局异常处理器
 * 统一处理分类相关的异常
 */
@RestControllerAdvice
@Slf4j
public class CategoryExceptionHandler {

    /**
     * 处理分类业务异常
     *
     * @param ex 分类异常
     * @return 异常响应
     */
    @ExceptionHandler(CategoryException.class)
    public ResponseEntity<Map<String, Object>> handleCategoryException(CategoryException ex) {
        log.error("分类业务异常: code={}, message={}", ex.getCode(), ex.getMessage(), ex);

        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("errorCode", ex.getCode());
        response.put("errorMessage", ex.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

}