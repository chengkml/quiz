package com.ck.quiz.cron.domain;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

/**
 * 队列定义表
 */
@Data
@NoArgsConstructor
@Entity
@Table(
        name = "job_queue",
        indexes = {
                @Index(name = "idx_queue_name", columnList = "queue_name"),
                @Index(name = "idx_queue_state", columnList = "state")
        }
)
public class JobQueue {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    @Comment("id")
    private String id;

    @Column(name = "queue_name", length = 128)
    @Comment("队列名")
    private String queueName;

    @Column(name = "queue_label", length = 128)
    @Comment("队列中文名")
    private String queueLabel;

    @Column(name = "queue_size")
    @Comment("队列大小")
    private int queueSize;

    @Column(name = "state", length = 64)
    @Comment("队列状态")
    private String state;

    @Comment("创建时间")
    @Column(name = "create_time")
    private LocalDateTime createTime;

}
