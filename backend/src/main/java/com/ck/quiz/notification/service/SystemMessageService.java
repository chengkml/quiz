package com.ck.quiz.notification.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.ck.quiz.cron.dto.JobDto;

import java.util.List;

/**
 * 系统消息服务接口
 */
public interface SystemMessageService {

    /**
     * 获取用户的消息列表（分页）
     *
     * @param userId 用户ID
     * @param pageable 分页参数
     * @return 消息分页数据
     */
    Page<?> getUserMessages(String userId, Pageable pageable);

    /**
     * 获取用户的未读消息列表（分页）
     *
     * @param userId 用户ID
     * @param pageable 分页参数
     * @return 未读消息分页数据
     */
    Page<?> getUserUnreadMessages(String userId, Pageable pageable);

    /**
     * 获取用户的未读消息数
     *
     * @param userId 用户ID
     * @return 未读消息数
     */
    long getUnreadCount(String userId);

    /**
     * 标记消息为已读
     *
     * @param messageId 消息ID
     */
    void markAsRead(String messageId);

    /**
     * 标记所有消息为已读
     *
     * @param userId 用户ID
     */
    void markAllAsRead(String userId);

    /**
     * 删除消息
     *
     * @param messageId 消息ID
     */
    void deleteMessage(String messageId);

    /**
     * 删除所有消息
     *
     * @param userId 用户ID
     */
    void deleteAllMessages(String userId);

    /**
     * 获取消息详情
     *
     * @param messageId 消息ID
     * @return 消息详情
     */
    Object getMessageDetail(String messageId);
}
