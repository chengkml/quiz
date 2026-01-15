package com.ck.quiz.syslog.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("系统日志表")
@EqualsAndHashCode(callSuper = true)
@Table(
        name = "sys_log",
        indexes = {
                @Index(name = "idx_sys_log_module", columnList = "module"),
                @Index(name = "idx_sys_log_action", columnList = "action"),
                @Index(name = "idx_sys_log_success", columnList = "success"),
                @Index(name = "idx_sys_log_create_date", columnList = "create_date")
        }
)
public class SysLog extends Model {

    @Column(name = "module", length = 64, nullable = false)
    @Comment("业务模块")
    private String module;

    @Column(name = "action", length = 64, nullable = false)
    @Comment("操作类型")
    private String action;

    @Column(name = "request_uri", length = 512)
    @Comment("请求URI")
    private String requestUri;

    @Column(name = "request_method", length = 16)
    @Comment("请求方法")
    private String requestMethod;

    @Column(name = "request_params", columnDefinition = "TEXT")
    @Comment("请求参数")
    private String requestParams;

    @Column(name = "response_data", columnDefinition = "TEXT")
    @Comment("响应数据")
    private String responseData;

    @Column(name = "success")
    @Comment("是否成功")
    private String success;

    @Column(name = "error_message", columnDefinition = "TEXT")
    @Comment("错误信息")
    private String errorMessage;

    @Column(name = "ip_address", length = 64)
    @Comment("IP地址")
    private String ipAddress;

    @Column(name = "user_agent", length = 512)
    @Comment("User-Agent")
    private String userAgent;

    @Column(name = "cost_time")
    @Comment("耗时毫秒")
    private Long costTime;
}
