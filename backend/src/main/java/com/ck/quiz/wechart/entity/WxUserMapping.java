package com.ck.quiz.wechart.entity;

import com.ck.quiz.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 小程序用户与 Web 用户映射实体类
 * <p>
 * 用于管理微信小程序用户（openid）与系统 Web 用户（user_id）的绑定关系。
 * 考虑多 AppId 场景，每个小程序 AppId 下的 openid 是唯一的。
 */
@Entity
@Table(
        name = "wx_user_mapping",
        indexes = {
                // 保证同一个 AppId 下的 openid 唯一，一个小程序用户只能绑定一个系统用户
                @Index(name = "uk_wx_user_appid_openid", columnList = "appid, openid", unique = true),
                // 提高基于 user_id 查询效率
                @Index(name = "idx_wx_user_user_id", columnList = "user_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WxUserMapping {

    /**
     * 主键 ID（映射记录唯一标识）
     */
    @Id
    @Column(name = "mapping_id", length = 32, nullable = false)
    private String mappingId;

    /**
     * 系统 Web 用户（多对一关联）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "user_id")
    private User user;

    /**
     * 小程序 AppId，用于区分不同小程序
     */
    @Column(name = "app_id", length = 64, nullable = false)
    private String appId;

    /**
     * 小程序用户唯一标识（openid）
     */
    @Column(name = "open_id", length = 64, nullable = false)
    private String openId;

    /**
     * 映射绑定时间（可选，用于记录创建时间）
     */
    @Column(name = "create_time", nullable = false)
    private LocalDateTime createTime;
}
