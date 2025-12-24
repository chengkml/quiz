package com.ck.quiz.notification.service;

import lombok.Data;

@Data
public class SmsResult {

    private boolean success;
    private String vendor;      // aliyun / tencent
    private String requestId;
    private String message;     // 错误信息
}
