package com.ck.quiz.notification.service.impl;

import com.ck.quiz.notification.dto.SystemMessageDto;
import com.ck.quiz.notification.entity.SystemMessage;
import com.ck.quiz.notification.repository.SystemMessageRepository;
import com.ck.quiz.notification.service.SystemMessageService;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.ck.quiz.websocket.WsAction;
import com.ck.quiz.websocket.WsBizType;
import com.ck.quiz.websocket.WsEventMessage;
import com.ck.quiz.websocket.WsEventType;
import com.ck.quiz.websocket.WsMessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 系统消息服务实现
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SystemMessageServiceImpl implements SystemMessageService {

    private final SystemMessageRepository messageRepository;
    private final NamedParameterJdbcTemplate jdbcTemplate;
    private final WsMessageService wsMessageService;

    @Override
    public Page<?> getUserMessages(String state, String userId, Pageable pageable) {
        StringBuilder sql = new StringBuilder(
                "SELECT sm.id, sm.user_id, sm.title, sm.content, sm.type, sm.is_read, " +
                        "sm.read_date, sm.priority, sm.status, sm.sender_id, sm.link_url, " +
                        "sm.create_date, sm.expire_date " +
                        "FROM system_message sm "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM system_message sm "
        );

        sql.append(" WHERE sm.user_id = :userId AND sm.status = :status ");
        countSql.append(" WHERE sm.user_id = :userId AND sm.status = :status ");

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("status", SystemMessage.MessageStatus.ACTIVE.name());

        if ("read".equalsIgnoreCase(state)) {
            sql.append(" AND sm.is_read = :isRead ");
            countSql.append(" AND sm.is_read = :isRead ");
            params.put("isRead", true);
        } else if ("unread".equalsIgnoreCase(state)) {
            sql.append(" AND sm.is_read = :isRead ");
            countSql.append(" AND sm.is_read = :isRead ");
            params.put("isRead", false);
        }

        // 排序
        sql.append(" ORDER BY sm.create_date DESC ");

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), 
                (int) pageable.getPageNumber(), (int) pageable.getPageSize());

        List<SystemMessageDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            SystemMessageDto dto = new SystemMessageDto();
            dto.setId(rs.getString("id"));
            dto.setUserId(rs.getString("user_id"));
            dto.setTitle(rs.getString("title"));
            dto.setContent(rs.getString("content"));
            dto.setType(rs.getString("type"));
            dto.setIsRead(rs.getBoolean("is_read"));
            dto.setReadDate(rs.getTimestamp("read_date") != null ? rs.getTimestamp("read_date").toLocalDateTime() : null);
            dto.setPriority(rs.getString("priority"));
            dto.setStatus(rs.getString("status"));
            dto.setSenderId(rs.getString("sender_id"));
            dto.setLinkUrl(rs.getString("link_url"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setExpireDate(rs.getTimestamp("expire_date") != null ? rs.getTimestamp("expire_date").toLocalDateTime() : null);
            return dto;
        });

        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, 
                (int) pageable.getPageNumber(), (int) pageable.getPageSize());
    }

    @Override
    public Page<?> getUserUnreadMessages(String userId, Pageable pageable) {
        StringBuilder sql = new StringBuilder(
                "SELECT sm.id, sm.user_id, sm.title, sm.content, sm.type, sm.is_read, " +
                        "sm.read_date, sm.priority, sm.status, sm.sender_id, sm.link_url, " +
                        "sm.create_date, sm.expire_date " +
                        "FROM system_message sm "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM system_message sm "
        );

        sql.append(" WHERE sm.user_id = :userId AND sm.is_read = :isRead AND sm.status = :status ");
        countSql.append(" WHERE sm.user_id = :userId AND sm.is_read = :isRead AND sm.status = :status ");

        Map<String, Object> params = new HashMap<>();
        params.put("userId", userId);
        params.put("isRead", false);
        params.put("status", SystemMessage.MessageStatus.ACTIVE.name());

        // 排序
        sql.append(" ORDER BY sm.create_date DESC ");

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), 
                (int) pageable.getPageNumber(), (int) pageable.getPageSize());

        List<SystemMessageDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            SystemMessageDto dto = new SystemMessageDto();
            dto.setId(rs.getString("id"));
            dto.setUserId(rs.getString("user_id"));
            dto.setTitle(rs.getString("title"));
            dto.setContent(rs.getString("content"));
            dto.setType(rs.getString("type"));
            dto.setIsRead(rs.getBoolean("is_read"));
            dto.setReadDate(rs.getTimestamp("read_date") != null ? rs.getTimestamp("read_date").toLocalDateTime() : null);
            dto.setPriority(rs.getString("priority"));
            dto.setStatus(rs.getString("status"));
            dto.setSenderId(rs.getString("sender_id"));
            dto.setLinkUrl(rs.getString("link_url"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setExpireDate(rs.getTimestamp("expire_date") != null ? rs.getTimestamp("expire_date").toLocalDateTime() : null);
            return dto;
        });

        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, 
                (int) pageable.getPageNumber(), (int) pageable.getPageSize());
    }

    @Override
    public long getUnreadCount(String userId) {
        return messageRepository.countByUserIdAndIsReadFalseAndStatus(
                userId,
                SystemMessage.MessageStatus.ACTIVE
        );
    }

    @Override
    public void markAsRead(String messageId) {
        messageRepository.markAsRead(messageId, LocalDateTime.now());
        log.info("消息已标记为已读，messageId: {}", messageId);
        Optional<SystemMessage> op = messageRepository.findById(messageId);
        if (!op.isPresent()) {
            return;
        }
        String userId = op.get().getUserId();
        WsEventMessage wsMsg = WsEventMessage.builder()
                .type(WsEventType.SYS_MSG_NEW)
                .eventId(messageId)
                .bizType(WsBizType.SYSTEM)
                .bizId(null)
                .action(WsAction.BADGE)
                .level("INFO")
                .timestamp(System.currentTimeMillis())
                .build();
        wsMessageService.sendToUser(userId, "sys_msg", wsMsg);

    }

    @Override
    public void markAllAsRead(String userId) {
        messageRepository.markAllAsRead(userId, SystemMessage.MessageStatus.ACTIVE, LocalDateTime.now());
        log.info("用户所有消息已标记为已读，userId: {}", userId);
    }

    @Override
    public void deleteMessage(String messageId) {
        messageRepository.deleteMessage(messageId);
        log.info("消息已删除，messageId: {}", messageId);
    }

    @Override
    public void deleteAllMessages(String userId) {
        messageRepository.deleteAllMessages(userId);
        log.info("用户所有消息已删除，userId: {}", userId);
    }

    @Override
    public Object getMessageDetail(String messageId) {
        return messageRepository.findById(messageId)
                .map(this::convertToDto)
                .orElse(null);
    }

    /**
     * 将实体转换为DTO
     */
    private SystemMessageDto convertToDto(SystemMessage message) {
        return SystemMessageDto.builder()
                .id(message.getId())
                .userId(message.getUserId())
                .title(message.getTitle())
                .content(message.getContent())
                .type(message.getType().name())
                .isRead(message.getIsRead())
                .readDate(message.getReadDate())
                .priority(message.getPriority().name())
                .status(message.getStatus().name())
                .senderId(message.getSenderId())
                .linkUrl(message.getLinkUrl())
                .createDate(message.getCreateDate())
                .expireDate(message.getExpireDate())
                .build();
    }
}
