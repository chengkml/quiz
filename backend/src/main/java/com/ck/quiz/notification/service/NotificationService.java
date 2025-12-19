package com.ck.quiz.notification.service;

import java.util.List;

import com.ck.quiz.cron.dto.JobDto;

public interface NotificationService {

    /**
     * 发送系统消息给单个用户
     *
     * @param userId 接收用户ID
     * @param title 消息标题
     * @param content 消息内容
     * @param type 消息类型
     * @return 消息ID
     */
    JobDto sendMessage(String userId, String title, String content, String type);

    /**
     * 发送系统消息给多个用户
     *
     * @param userIds 接收用户ID列表
     * @param title 消息标题
     * @param content 消息内容
     * @param type 消息类型
     * @return 消息ID列表
     */
    List<JobDto> sendMessageBatch(List<String> userIds, String title, String content, String type);

    /**
     * 发送系统消息给所有用户
     *
     * @param title 消息标题
     * @param content 消息内容
     * @param type 消息类型
     * @return 消息ID列表
     */
    List<JobDto> sendMessageToAll(String title, String content, String type);
    
}
