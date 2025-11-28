package com.ck.quiz.wechart.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    @Column(name = "appid", length = 64, nullable = false)
    private String appid;

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

    /**
     * 创建时间
     */
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;

    /**
     * 更新时间
     */
    @Column(name = "update_time")
    private LocalDateTime updateTime;
}
