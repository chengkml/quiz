package com.ck.quiz.cron.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

/**
 * 队列任务
 */
@Data
@NoArgsConstructor
@Entity
@Table(
        name = "synth_job",
        indexes = {
                @Index(name = "idx_job_state", columnList = "state"),
                @Index(name = "idx_job_queue", columnList = "queue_name"),
                @Index(name = "idx_job_state_queue", columnList = "state, queue_name")
        }
)
public class Job {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    @Comment("id")
    private String id;

    @Column(name = "task_id", length = 64)
    @Comment("任务编码")
    private String taskId;

    @Column(name = "task_class", length = 512)
    @Comment("实现类")
    private String taskClass;

    @Column(name = "queue_name", length = 128)
    @Comment("队列")
    private String queueName;

    @Lob
    @Column(name = "task_params", columnDefinition = "LONGTEXT")
    @Comment("任务参数")
    private String taskParams;

    @Column(name = "trigger_type", length = 32)
    @Comment("触发方式")
    private String triggerType;

    @Column(name = "state", length = 64)
    @Comment("任务状态")
    private String state;

    @Column(name = "start_time")
    @Comment("开始时间")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    @Comment("结束时间")
    private LocalDateTime endTime;

    @Column(name = "duration_ms")
    @Comment("执行耗时（毫秒）")
    private Long durationMs;

    @Column(name = "log_path", length = 1024)
    @Comment("日志文件路径")
    private String logPath;

    @Lob
    @Column(name = "error_message", columnDefinition = "LONGTEXT")
    @Comment("错误信息")
    private String errorMessage;

    @Column(name = "create_time", updatable = false)
    @Comment("记录创建时间")
    private LocalDateTime createTime;

}
