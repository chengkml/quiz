package com.ck.quiz.cron.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

/**
 * 排队任务
 */
@Data
@NoArgsConstructor
@Entity
@Table(
        name = "synth_pending_job_log",
        indexes = {
                @Index(name = "idx_pjobl_task_id", columnList = "task_id"),
                @Index(name = "idx_pjobl_priority", columnList = "priority"),
                @Index(name = "idx_pjobl_ptime", columnList = "pop_time")
        }
)
public class PendingJobLog {

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

    @Lob
    @Column(name = "task_params", columnDefinition = "LONGTEXT")
    @Comment("任务参数")
    private String taskParams;

    @Column(name = "trigger_type", length = 32)
    @Comment("触发方式")
    private String triggerType;

    @Comment("优先级")
    private int priority;

    @Column(name = "queue_name", length = 128)
    @Comment("队列")
    private String queueName;

    @Comment("出队时间")
    @Column(name = "pop_time")
    private LocalDateTime popTime;

}
