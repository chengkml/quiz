package com.ck.quiz.notification.service;

import java.util.Map;

public interface SmsService {

    /**
     * 发送验证码
     */
    SmsResult sendVerifyCode(String phone, String code);

    /**
     * 发送通知类短信
     */
    SmsResult sendTemplate(
        String phone,
        String templateCode,
        Map<String, String> params
    );
}
