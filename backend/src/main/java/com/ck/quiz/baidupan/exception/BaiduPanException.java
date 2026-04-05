package com.ck.quiz.baidupan.exception;

import org.springframework.http.HttpStatus;

public class BaiduPanException extends RuntimeException {

    private final HttpStatus status;
    private final String code;

    public BaiduPanException(HttpStatus status, String code, String message) {
        super(message);
        this.status = status;
        this.code = code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getCode() {
        return code;
    }

    public static BaiduPanException serviceUnavailable(String code, String message) {
        return new BaiduPanException(HttpStatus.SERVICE_UNAVAILABLE, code, message);
    }

    public static BaiduPanException badRequest(String code, String message) {
        return new BaiduPanException(HttpStatus.BAD_REQUEST, code, message);
    }
}
