package com.ck.quiz.baidupan.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice(basePackages = "com.ck.quiz.baidupan")
public class BaiduPanExceptionHandler {

    @ExceptionHandler(BaiduPanException.class)
    public ResponseEntity<Map<String, Object>> handleBaiduPanException(BaiduPanException e) {
        log.warn("百度网盘模块异常: {}", e.getMessage());

        Map<String, Object> result = new HashMap<>();
        result.put("success", false);
        result.put("code", e.getCode());
        result.put("message", e.getMessage());

        return ResponseEntity.status(e.getStatus()).body(result);
    }
}
