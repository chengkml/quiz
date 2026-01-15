package com.ck.quiz.chat.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@EqualsAndHashCode(callSuper = true)
@Table(name = "chat_message", indexes = {
        @Index(name = "idx_chat_message_session", columnList = "session_id"),
        @Index(name = "idx_chat_message_create", columnList = "create_date")
})
public class ChatMessage extends Model {

    @Column(name = "session_id", length = 32, nullable = false)
    @Comment("所属会话ID")
    private String sessionId;

    @Column(name = "role", length = 32, nullable = false)
    @Comment("消息角色")
    private String role;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    @Comment("消息内容")
    private String content;

    @Column(name = "seq")
    @Comment("会话内顺序")
    private Integer seq;

    @Column(name = "tokens")
    @Comment("消息token数")
    private Integer tokens;

    @Column(name = "error_flag")
    @Comment("是否异常消息")
    private Boolean errorFlag;
}

