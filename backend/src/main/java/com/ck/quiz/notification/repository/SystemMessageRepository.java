package com.ck.quiz.notification.repository;

import com.ck.quiz.notification.entity.SystemMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 系统消息数据访问层
 */
@Repository
public interface SystemMessageRepository extends JpaRepository<SystemMessage, String> {

        /**
         * 查询用户的未读消息数
         *
         * @param userId 用户ID
         * @return 未读消息数
         */
        long countByUserIdAndIsReadFalseAndStatus(String userId, SystemMessage.MessageStatus status);

        /**
         * 查询用户的所有未读消息
         *
         * @param userId 用户ID
         * @return 未读消息列表
         */
        List<SystemMessage> findByUserIdAndIsReadFalseAndStatusOrderByPriorityDescCreateDateDesc(
                        String userId,
                        SystemMessage.MessageStatus status);

        /**
         * 标记用户的消息为已读
         *
         * @param messageId 消息ID
         */
        @Modifying
        @Query("UPDATE SystemMessage m SET m.isRead = true, m.readDate = :readDate WHERE m.id = :messageId")
        void markAsRead(@Param("messageId") String messageId, @Param("readDate") LocalDateTime readDate);

        /**
         * 标记用户的所有消息为已读
         *
         * @param userId 用户ID
         */
        @Modifying
        @Query("UPDATE SystemMessage m SET m.isRead = true, m.readDate = :readDate WHERE m.userId = :userId AND m.isRead = false AND m.status = :status")
        void markAllAsRead(@Param("userId") String userId, @Param("status") SystemMessage.MessageStatus status,
                        @Param("readDate") LocalDateTime readDate);

        /**
         * 逻辑删除消息
         *
         * @param messageId 消息ID
         */
        @Modifying
        @Query("UPDATE SystemMessage m SET m.status = 'DELETED' WHERE m.id = :messageId")
        void deleteMessage(@Param("messageId") String messageId);

        /**
         * 逻辑删除用户的所有消息
         *
         * @param userId 用户ID
         */
        @Modifying
        @Query("UPDATE SystemMessage m SET m.status = 'DELETED' WHERE m.userId = :userId AND m.status = 'ACTIVE'")
        void deleteAllMessages(@Param("userId") String userId);
}
