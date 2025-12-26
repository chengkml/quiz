package com.ck.quiz.notification.service.impl;

import org.springframework.stereotype.Component;

import com.ck.quiz.notification.service.NotificationChannel;
import com.ck.quiz.notification.service.NotificationChannelType;
import com.ck.quiz.notification.service.NotificationMessage;
import com.ck.quiz.notification.service.SmsResult;
import com.ck.quiz.notification.service.SmsService;
import com.ck.quiz.notification.service.SmsServiceFactory;

import jakarta.annotation.Resource;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class SmsChannel implements NotificationChannel {

    @Resource
    private SmsServiceFactory smsServiceFactory;

    @Override
    public NotificationChannelType getType() {
        return NotificationChannelType.SMS;
    }

    @Override
    public void send(NotificationMessage message) {
        // 默认使用阿里云，可通过配置指定使用其他服务商
        String vendor = "aliyun";

        SmsService smsService = smsServiceFactory.getService(vendor);

        // 发送短信（简单内容发送）
        SmsResult result = smsService.sendTemplate(
                message.getTo(),
                "notification",
                java.util.Map.of("content", message.getContent()));

        if (result.isSuccess()) {
            log.info("短信发送成功 -> phone: {}, vendor: {}, requestId: {}",
                    message.getTo(), result.getVendor(), result.getRequestId());
        } else {
            log.warn("短信发送失败 -> phone: {}, vendor: {}, message: {}",
                    message.getTo(), result.getVendor(), result.getMessage());
        }
    }
}
