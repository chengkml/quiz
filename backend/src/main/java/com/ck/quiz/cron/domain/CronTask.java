package com.ck.quiz.cron.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;


@Data
@NoArgsConstructor
@Entity
@Table(
        name = "cron_task",
        indexes = {
                @Index(name = "idx_ctask_name", columnList = "name"),
                @Index(name = "idx_ctask_state", columnList = "state"),
                @Index(name = "idx_ctask_queue_state", columnList = "queue_name, state")
        }
)
public class CronTask {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    @Comment("id")
    private String id;

    @Column(name = "name", length = 64)
    @Comment("名称")
    private String name;

    @Column(name = "label", length = 128)
    @Comment("中文")
    private String label;

    @Column(name = "next_fire_time", length = 32)
    @Comment("下一次执行时间")
    private String nextFireTime;

    @Column(name = "cron_expression", length = 32)
    @Comment("表达式")
    private String cronExpression;

    @Column(name = "state", length = 32)
    @Comment("是否启用")
    private String state;

    @Column(name = "task_class", length = 512)
    @Comment("实现类")
    private String taskClass;

    @Lob
    @Column(name = "fire_params", columnDefinition = "LONGTEXT")
    @Comment("触发参数")
    private String fireParams;

    @Column(name = "queue_name", length = 128)
    @Comment("队列")
    private String queueName;
}
