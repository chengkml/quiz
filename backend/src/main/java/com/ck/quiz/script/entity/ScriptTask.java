package com.ck.quiz.script.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 脚本执行任务实体类
 * 记录每次脚本运行的状态与结果
 */
@Entity
@Table(
        name = "script_task",
        indexes = {
                @Index(name = "idx_script_task_status", columnList = "status")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScriptTask {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id;

    /**
     * 任务唯一编码
     */
    @Column(name = "task_code", length = 64, nullable = false, unique = true)
    private String taskCode;

    /**
     * 脚本ID
     */
    @Column(name = "script_id", length = 32, nullable = false)
    private String scriptId;

    /**
     * 执行状态（pending/running/success/failed）
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.PENDING;

    /**
     * 执行开始时间
     */
    @Column(name = "start_time")
    private LocalDateTime startTime;

    /**
     * 执行结束时间
     */
    @Column(name = "end_time")
    private LocalDateTime endTime;

    /**
     * 执行耗时（毫秒）
     */
    @Column(name = "duration_ms")
    private Long durationMs;

    /**
     * 输入参数（JSON）
     */
    @Lob
    @Column(name = "input_params", columnDefinition = "LONGTEXT")
    private String inputParams;

    /**
     * 输出结果（JSON）
     */
    @Lob
    @Column(name = "output_result", columnDefinition = "LONGTEXT")
    private String outputResult;

    /**
     * 退出码
     */
    @Column(name = "exit_code")
    private Integer exitCode;

    /**
     * 错误信息
     */
    @Lob
    @Column(name = "error_message", columnDefinition = "LONGTEXT")
    private String errorMessage;

    /**
     * 日志文件路径
     */
    @Column(name = "log_path", length = 512)
    private String logPath;

    /**
     * 创建时间
     */
    @Column(name = "create_date", updatable = false)
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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            this.createUser = auth.getName();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            this.updateUser = auth.getName();
        }
    }

    public enum Status {
        PENDING,
        RUNNING,
        SUCCESS,
        FAILED
    }
}
