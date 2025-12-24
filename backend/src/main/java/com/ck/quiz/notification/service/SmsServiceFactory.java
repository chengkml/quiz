package com.ck.quiz.notification.service;

import org.springframework.stereotype.Service;

import jakarta.annotation.Resource;

@Service
public class SmsServiceFactory {

    @Resource(name = "aliyunSmsService")
    private SmsService aliyun;

    public SmsService getService(String vendor) {
        return aliyun;
    }
}

