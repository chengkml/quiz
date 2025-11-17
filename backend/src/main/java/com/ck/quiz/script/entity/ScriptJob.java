package com.ck.quiz.script.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 脚本执行任务实体类
 * 记录每次脚本运行的状态与结果
 */
@Entity
@Table(
        name = "script_job",
        indexes = {
                @Index(name = "idx_script_job", columnList = "script_id,job_id")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScriptJob {

    @Id
    @Column(name = "id", length = 32, nullable = false)
    private String id;

    /**
     * 脚本ID
     */
    @Column(name = "script_id", length = 32, nullable = false)
    private String scriptId;

    /**
     * 作业ID
     */
    @Column(name = "job_id", length = 64, nullable = false)
    private String jobId;
}
