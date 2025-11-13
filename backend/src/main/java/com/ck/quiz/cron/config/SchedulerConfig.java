package com.ck.quiz.cron.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.SchedulingConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.scheduling.config.ScheduledTaskRegistrar;


@Configuration
public class SchedulerConfig implements SchedulingConfigurer{
	
	@Override
    public void configureTasks(ScheduledTaskRegistrar taskRegistrar) {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(10);
        scheduler.setThreadNamePrefix("dynamic-task-");
        scheduler.initialize();
        taskRegistrar.setTaskScheduler(scheduler);
    }

    @Bean
    public ScheduledTaskRegistrar taskRegistrar() {
        return new ScheduledTaskRegistrar();
    }


}
