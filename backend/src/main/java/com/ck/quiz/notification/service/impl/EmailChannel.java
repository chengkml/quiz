package com.ck.quiz.notification.service.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.ck.quiz.config.service.SystemParamService;
import com.ck.quiz.notification.service.NotificationChannel;
import com.ck.quiz.notification.service.NotificationChannelType;
import com.ck.quiz.notification.service.NotificationMessage;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
public class EmailChannel implements NotificationChannel {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private SystemParamService systemParamService;

    @Override
    public NotificationChannelType getType() {
        return NotificationChannelType.EMAIL;
    }

    @Override
    public void send(NotificationMessage message) {
        try {
            if (!StringUtils.hasText(message.getTo())) {
                throw new IllegalArgumentException("邮件接收地址为空");
            }

            // 从配置表获取发件人地址
            String from = getMailUsername();
            if (!StringUtils.hasText(from)) {
                throw new IllegalArgumentException("未配置发件人地址");
            }

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            // 设置发件人
            helper.setFrom(from);
            
            // 设置收件人
            helper.setTo(message.getTo());
            
            // 设置主题
            if (StringUtils.hasText(message.getTitle())) {
                helper.setSubject(message.getTitle());
            } else {
                helper.setSubject("系统通知");
            }
            
            // 设置邮件内容（支持HTML）
            helper.setText(message.getContent(), true);
            
            // 发送邮件
            mailSender.send(mimeMessage);
            
            log.info("邮件发送成功 - 收件人: {}, 主题: {}", message.getTo(), message.getTitle());
            
        } catch (Exception e) {
            throw new RuntimeException("邮件发送失败: " + e.getMessage(), e);
        }
    }

    /**
     * 从配置表获取邮件用户名
     */
    private String getMailUsername() {
        try {
            return systemParamService.getParamByName("mail.username").getParamValue();
        } catch (Exception e) {
            log.error("获取邮件用户名配置失败", e);
            return null;
        }
    }
}
