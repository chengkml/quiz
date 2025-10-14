package com.ck.quiz.datasource.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 数据库连接信息实体
 */
@Entity
@Table(
        name = "datasource",
        indexes = {
                @Index(name = "idx_datasource_name", columnList = "name"),
                @Index(name = "idx_datasource_active", columnList = "active"),
                @Index(name = "idx_datasource_create_date", columnList = "create_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Datasource {

    @Id
    @Column(name = "ds_id", length = 32, nullable = false)
    private String id;

    /**
     * 连接名称
     */
    @Column(name = "name", length = 100, nullable = false)
    private String name;

    /**
     * JDBC 驱动类名
     */
    @Column(name = "driver", length = 200)
    private String driver;

    /**
     * JDBC 连接字符串
     */
    @Lob
    @Column(name = "jdbc_url", nullable = false)
    private String jdbcUrl;

    /**
     * 用户名
     */
    @Column(name = "username", length = 100)
    private String username;

    /**
     * 密码（明文存储请谨慎，建议后续接入加密）
     */
    @Column(name = "password", length = 200)
    private String password;

    /**
     * 连接描述
     */
    @Column(name = "description")
    private String description;

    /**
     * 是否启用
     */
    @Column(name = "active")
    private Boolean active = true;

    /**
     * 创建时间
     */
    @Column(name = "create_date")
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    @Column(name = "create_user", length = 32)
    private String createUser;

    /**
     * 更新时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    @Column(name = "update_user", length = 32)
    private String updateUser;
}