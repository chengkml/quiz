package com.ck.quiz.config;

import com.ck.quiz.config.service.SystemParamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

/**
 * 邮件配置类 - 从system_param表动态读取配置
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class MailConfig {

    private final SystemParamService systemParamService;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();

        try {
            // 从配置表读取邮件配置
            String host = getParamValue("mail.host", "smtp.example.com");
            String portStr = getParamValue("mail.port", "587");
            String username = getParamValue("mail.username", "");
            String password = getParamValue("mail.password", "");
            String encoding = getParamValue("mail.encoding", "UTF-8");
            
            // SMTP认证配置
            String smtpAuth = getParamValue("mail.smtp.auth", "true");
            String smtpStarttlsEnable = getParamValue("mail.smtp.starttls.enable", "true");
            String smtpStarttlsRequired = getParamValue("mail.smtp.starttls.required", "true");

            mailSender.setHost(host);
            mailSender.setPort(Integer.parseInt(portStr));
            mailSender.setUsername(username);
            mailSender.setPassword(password);
            mailSender.setDefaultEncoding(encoding);

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.smtp.auth", smtpAuth);
            props.put("mail.smtp.starttls.enable", smtpStarttlsEnable);
            props.put("mail.smtp.starttls.required", smtpStarttlsRequired);

            log.info("邮件配置加载完成 - Host: {}, Port: {}, Username: {}", host, portStr, username);
        } catch (Exception e) {
            log.error("加载邮件配置失败，使用默认配置", e);
            // 使用默认配置
            mailSender.setHost("smtp.example.com");
            mailSender.setPort(587);
            mailSender.setDefaultEncoding("UTF-8");
        }

        return mailSender;
    }

    /**
     * 从配置表获取参数值
     */
    private String getParamValue(String paramName, String defaultValue) {
        try {
            return systemParamService.getParamByName(paramName).getParamValue();
        } catch (Exception e) {
            log.warn("获取参数 {} 失败，使用默认值: {}", paramName, defaultValue);
            return defaultValue;
        }
    }
}
