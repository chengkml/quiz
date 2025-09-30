package com.ck.quiz.subject.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * 学科管理模块全局异常处理器
 */
@Slf4j
@RestControllerAdvice(basePackages = "com.ck.quiz.subject")
public class SubjectExceptionHandler {

    /**
     * 处理学科管理业务异常
     */
    @ExceptionHandler(SubjectException.class)
    public ResponseEntity<Map<String, Object>> handleSubjectException(SubjectException e) {
        log.error("学科管理异常: code={}, message={}", e.getCode(), e.getMessage());

        Map<String, Object> body = new HashMap<>();
        body.put("success", false);
        body.put("errorCode", e.getCode());
        body.put("errorMessage", e.getMessage());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

}