package com.ck.quiz.notification.service.impl;

import java.util.Map;
import org.springframework.stereotype.Service;

import com.ck.quiz.notification.service.SmsResult;
import com.ck.quiz.notification.service.SmsService;

import lombok.extern.slf4j.Slf4j;

/**
 * 阿里云短信服务实现
 */
@Slf4j
@Service("aliyunSmsService")
public class AliyunSmsService implements SmsService {@Override
    public SmsResult sendVerifyCode(String phone, String code) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'sendVerifyCode'");
    }

    @Override
    public SmsResult sendTemplate(String phone, String templateCode, Map<String, String> params) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'sendTemplate'");
    }

}