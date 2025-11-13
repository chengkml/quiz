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
        name = "synth_pending_job",
        indexes = {
                @Index(name = "idx_pjob_task", columnList = "task_id"),
                @Index(name = "idx_pjob_queue", columnList = "queue_name"),
                @Index(name = "idx_pjob_priority", columnList = "priority"),
                @Index(name = "idx_pjob_ptime", columnList = "push_time"),
                @Index(name = "idx_pjob_qu_pri_ptime", columnList = "queue_name,priority,push_time")
        }
)
public class PendingJob {

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

    @Comment("入队时间")
    @Column(name = "push_time")
    private LocalDateTime pushTime;

    @Comment("出队批次号")
    @Column(name = "pop_batch_no")
    private String popBatchNo;

}
