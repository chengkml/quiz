package com.ck.quiz.doc.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.HashMap;
import java.util.Map;

/**
 * 文档模块异常处理器
 * 用于统一处理文档相关的异常
 */
@ControllerAdvice
public class DocInfoExceptionHandler {

    /**
     * 处理文档相关的业务异常
     *
     * @param e 文档异常
     * @return 响应实体
     */
    @ExceptionHandler(DocInfoException.class)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> handleDocInfoException(DocInfoException e) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", e.getCode());
        response.put("message", e.getMessage());
        response.put("success", false);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }

    /**
     * 处理其他未捕获的异常
     *
     * @param e 异常
     * @return 响应实体
     */
    @ExceptionHandler(Exception.class)
    @ResponseBody
    public ResponseEntity<Map<String, Object>> handleOtherException(Exception e) {
        Map<String, Object> response = new HashMap<>();
        response.put("code", "SYSTEM_ERROR");
        response.put("message", "系统异常：" + e.getMessage());
        response.put("success", false);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}