package com.ck.quiz.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web MVC 配置类
 * 处理静态资源映射和视图控制器配置
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {


    /**
     * 配置视图控制器
     * 将特定路径映射到静态页面
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 将 /login 路径映射到 index.html
        registry.addViewController("/login").setViewName("forward:/index.html");
        // 将根路径也映射到 index.html
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}