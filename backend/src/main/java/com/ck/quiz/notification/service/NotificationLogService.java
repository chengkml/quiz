package com.ck.quiz.notification.service;

import com.ck.quiz.notification.entity.NotificationLog;
import com.ck.quiz.notification.repository.NotificationLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class NotificationLogService {
    @Autowired
    private NotificationLogRepository notificationLogRepository;

    @Autowired
    private NotificationDispatcher notificationDispatcher;

    @Autowired
    private org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate jdbcTemplate;

    // 查询所有异常日志，支持关键字模糊查询
    public Page<NotificationLog> getErrorLogs(int page, int size, String keyWord) {
        StringBuilder sql = new StringBuilder(
                "SELECT id, channel_type, message_content, error_message, level, created_at " +
                "FROM notification_log WHERE level = :level "
        );
        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM notification_log WHERE level = :level "
        );
        Map<String, Object> params = new HashMap<>();
        params.put("level", "ERROR");

        if (keyWord != null && !keyWord.trim().isEmpty()) {
            sql.append(" AND (LOWER(channel_type) LIKE :keyWord OR LOWER(message_content) LIKE :keyWord OR LOWER(error_message) LIKE :keyWord) ");
            countSql.append(" AND (LOWER(channel_type) LIKE :keyWord OR LOWER(message_content) LIKE :keyWord OR LOWER(error_message) LIKE :keyWord) ");
            params.put("keyWord", "%" + keyWord.toLowerCase() + "%");
        }

        sql.append(" ORDER BY created_at DESC ");

        String pageSql = com.ck.quiz.utils.JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), page, size);

        List<NotificationLog> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            NotificationLog log = new NotificationLog();
            log.setId(rs.getLong("id"));
            log.setChannelType(rs.getString("channel_type"));
            log.setMessageContent(rs.getString("message_content"));
            log.setErrorMessage(rs.getString("error_message"));
            log.setLevel(NotificationLog.LogLevel.valueOf(rs.getString("level")));
            log.setCreatedAt(rs.getTimestamp("created_at").toLocalDateTime());
            return log;
        });

        return com.ck.quiz.utils.JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, page, size);
    }

    // 重试逻辑（伪实现，实际应集成消息发送服务）
    public boolean retrySend(Long logId) {
        Optional<NotificationLog> logOpt = notificationLogRepository.findById(logId);
        if (logOpt.isPresent()) {
            NotificationLog log = logOpt.get();
            // 只重试 ERROR 日志
            if (log.getLevel() != NotificationLog.LogLevel.ERROR) {
                return false;
            }
            try {
                // 反序列化 messageContent 为 NotificationMessage
                NotificationMessage message = parseMessageContent(log.getMessageContent());
                notificationDispatcher.dispatch(message);
                return true;
            } catch (Exception e) {
                // 失败可再次记录日志
                NotificationLog retryLog = new NotificationLog(
                        log.getChannelType(),
                        log.getMessageContent(),
                        "重试失败: " + e.getMessage()
                );
                notificationLogRepository.save(retryLog);
                return false;
            }
        }
        return false;
    }

    // 简单实现：假设 messageContent 为 NotificationMessage 的 toString，可用 JSON 替换
    private NotificationMessage parseMessageContent(String content) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();
            // 支持 JSR310 时间类型
            objectMapper.findAndRegisterModules();
            return objectMapper.readValue(content, NotificationMessage.class);
        } catch (Exception e) {
            throw new RuntimeException("消息内容反序列化失败", e);
        }
    }
}
