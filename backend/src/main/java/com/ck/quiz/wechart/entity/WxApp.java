package com.ck.quiz.wechart.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 小程序 App 信息实体类
 * <p>
 * 用于存储小程序的 AppId、AppSecret、名称等信息。
 * 支持多小程序场景，便于后端根据 AppId 获取对应的 secret。
 */
@Entity
@Table(
        name = "wx_app",
        indexes = {
                // 保证 appid 唯一，每个小程序唯一对应一条记录
                @Index(name = "uk_wx_app_appid", columnList = "appid", unique = true)
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxApp {

    /**
     * 主键 ID（记录唯一标识）
     */
    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id;

    /**
     * 小程序 AppId，用于调用微信接口
     */
    @Column(name = "app_id", length = 64, nullable = false)
    private String appId;

    /**
     * 小程序 AppSecret，用于调用微信接口
     * ⚠️ 属于敏感信息，只能在后端使用
     */
    @Column(name = "app_secret", length = 128, nullable = false)
    private String appSecret;

    /**
     * 小程序名称，可选，用于管理多个小程序
     */
    @Column(name = "app_name", length = 128)
    private String appName;

    @Column(name = "app_descr", length = 2048)
    private String appDescr;

    /**
     * 创建时间
     */
    @Column(name = "create_date", nullable = false)
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    /**
     * 更新时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    @Column(name = "update_user", length = 64)
    private String updateUser;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.createUser = authentication.getName();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.updateUser = authentication.getName();
        }
    }
}
