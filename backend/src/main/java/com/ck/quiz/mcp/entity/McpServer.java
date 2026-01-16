package com.ck.quiz.mcp.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

@Data
@Entity
@Comment("MCP服务器")
@EqualsAndHashCode(callSuper = true)
@Table(name = "mcp_server")
public class McpServer extends Model {

    @Column(length = 128, nullable = false)
    @Comment("服务器名称")
    private String name;

    @Column(length = 128, nullable = false, unique = true)
    @Comment("服务器标识")
    private String identifier;

    @Column(length = 512)
    @Comment("服务器描述")
    private String description;

    @Column(length = 32, nullable = false)
    @Comment("环境")
    private String env;

    @Column(length = 512, nullable = false)
    @Comment("服务器地址")
    private String address;

    @Column(length = 32, nullable = false)
    @Comment("协议")
    private String protocol;

    @Column(length = 32, nullable = false)
    @Comment("认证类型")
    private String authType;

    @Column(length = 4000)
    @Comment("认证配置")
    private String authConfig;

    @Column(length = 32, nullable = false)
    @Comment("状态")
    private String status = "CREATED";

    @Comment("最近心跳时间")
    private LocalDateTime lastHeartbeatAt;
}
