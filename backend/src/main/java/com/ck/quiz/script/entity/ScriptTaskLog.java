package com.ck.quiz.script.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 脚本执行日志实体类
 * 用于记录任务执行过程中的输出内容
 */
@Entity
@Table(
        name = "script_task_log",
        indexes = {
                @Index(name = "idx_script_log_task_id", columnList = "task_id"),
                @Index(name = "idx_script_log_time", columnList = "log_time")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScriptTaskLog {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id;

    /**
     * 任务ID
     */
    @Column(name = "task_id", length = 32, nullable = false)
    private String taskId;

    /**
     * 日志序号（顺序）
     */
    @Column(name = "log_seq")
    private Integer logSeq;

    /**
     * 日志时间
     */
    @Column(name = "log_time")
    private LocalDateTime logTime = LocalDateTime.now();

    /**
     * 日志级别（INFO/WARN/ERROR）
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "log_level", length = 16)
    private LogLevel logLevel = LogLevel.INFO;

    /**
     * 日志内容
     */
    @Lob
    @Column(name = "log_content", columnDefinition = "LONGTEXT")
    private String logContent;

    public enum LogLevel {
        INFO,
        WARN,
        ERROR
    }
}
