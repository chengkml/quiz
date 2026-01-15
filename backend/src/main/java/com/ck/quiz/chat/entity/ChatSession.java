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
@Table(name = "chat_session", indexes = {
        @Index(name = "idx_chat_session_user", columnList = "create_user"),
        @Index(name = "idx_chat_session_uuid", columnList = "session_uuid"),
        @Index(name = "idx_chat_session_update", columnList = "update_date")
})
public class ChatSession extends Model {

    @Column(name = "session_uuid", length = 64, nullable = false, unique = true)
    @Comment("会话对外ID")
    private String sessionUuid;

    @Column(name = "title", length = 255)
    @Comment("会话标题")
    private String title;

    @Column(name = "model_name", length = 100)
    @Comment("使用的模型名称")
    private String modelName;

    @Column(name = "temperature")
    @Comment("温度")
    private Double temperature;

    @Column(name = "max_tokens")
    @Comment("最大回复token数")
    private Integer maxTokens;

    @Column(name = "status", length = 32)
    @Comment("会话状态")
    private String status;

    @Column(name = "extra_config", columnDefinition = "TEXT")
    @Comment("额外配置")
    private String extraConfig;
}

