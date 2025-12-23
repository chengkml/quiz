package com.ck.quiz.notification.service.impl;

import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ck.quiz.cron.dto.JobDto;
import com.ck.quiz.cron.service.JobService;
import com.ck.quiz.notification.service.NotificationService;
import com.ck.quiz.user.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class NotificationServiceImpl implements NotificationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobService jobService;

    @Override
    public JobDto sendMessage(String userId, String title, String content, String type, String channel){
        JobDto job = new JobDto();
        job.setTaskClass("com.ck.quiz.cron.exec.NotificationJob");
        
        // 根据channel类型获取正确的接收人信息
        String to = userId;
        if ("EMAIL".equals(channel) || "SMS".equals(channel)) {
            var user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                if ("EMAIL".equals(channel)) {
                    to = user.getEmail();
                    if (to == null || to.isEmpty()) {
                        log.warn("用户 {} 没有邮箱地址，跳过发送", userId);
                        return null;
                    }
                } else if ("SMS".equals(channel)) {
                    to = user.getPhone();
                    if (to == null || to.isEmpty()) {
                        log.warn("用户 {} 没有电话号码，跳过发送", userId);
                        return null;
                    }
                }
            } else {
                log.warn("用户 {} 不存在，跳过发送", userId);
                return null;
            }
        }
        
        Map<String, Object> jobParams = new HashMap<>();
        jobParams.put("channelType", channel);
        jobParams.put("to", to);
        jobParams.put("title", title);
        jobParams.put("content", content);
        jobParams.put("type", type);
        jobParams.put("senderId", "SYSTEM");
        // jobParams 转 json string 
        String taskParamsJson;
        try {
            taskParamsJson = new ObjectMapper().writeValueAsString(jobParams);
        } catch (JsonProcessingException e) {
            log.error("转换任务参数为JSON失败", e);
            throw new RuntimeException("转换任务参数为JSON失败", e);
        }
        job.setTaskParams(taskParamsJson);

        try {
            jobService.addJob(job);
        } catch (ClassNotFoundException | NoSuchMethodException | InvocationTargetException
                    | IllegalAccessException e) {
                log.error("添加通知任务失败", e);
                throw new RuntimeException("添加通知任务失败", e);
        }
        return job;
    }

    @Override
    public List<JobDto> sendMessageBatch(List<String> userIds, String title, String content, String type, String channel) {
        List<JobDto> jobs = new ArrayList<>();
        for (String userId : userIds) {
            JobDto job = sendMessage(userId, title, content, type, channel);
            if (job != null) {
                jobs.add(job);
            }
        }
        return jobs;
    }

    @Override
    public List<JobDto> sendMessageToAll(String title, String content, String type, String channel) {
        List<String> userIds = userRepository.findAll().stream()
                .map(u -> u.getUserId())
                .collect(Collectors.toList());
        return sendMessageBatch(userIds, title, content, type, channel);
    }
    
}
