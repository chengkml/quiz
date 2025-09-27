package com.ck.quiz.utils;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

@Component
public class SpringContextUtil implements ApplicationContextAware {

    private static ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        context = applicationContext;
    }

    /**
     * 获取指定类型的 Bean
     */
    public static <T> T getBean(Class<T> clazz) {
        return context.getBean(clazz);
    }

    /**
     * 获取指定名称的 Bean
     */
    public static Object getBean(String name) {
        return context.getBean(name);
    }

    /**
     * 获取指定名称和类型的 Bean
     */
    public static <T> T getBean(String name, Class<T> clazz) {
        return context.getBean(name, clazz);
    }
}

