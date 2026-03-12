package com.ck.quiz.project.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("项目需求")
@EqualsAndHashCode(callSuper = true)
@Table(name = "project_requirement", indexes = {
        @Index(name = "idx_requirement_status", columnList = "status"),
        @Index(name = "idx_requirement_priority", columnList = "priority")
})
public class Requirement extends Model {

    @Column(length = 256, nullable = false)
    @Comment("标题")
    private String title;

    @Column(length = 128)
    @Comment("项目名称")
    private String projectName;

    @Column(length = 512)
    @Comment("Git 仓库地址")
    private String gitUrl;

    @Column(length = 128)
    @Comment("分支名称")
    private String branch = "main";

    @Column(columnDefinition = "TEXT")
    @Comment("描述")
    private String descr;

    @Column(columnDefinition = "TEXT")
    @Comment("处理结果/错误信息")
    private String resultMsg;

    @Column
    @Comment("开发进度百分比(0-100)")
    private Integer progressPercent = 0;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("状态：OPEN, IN_PROGRESS, COMPLETED, CLOSED")
    private Status status = Status.OPEN;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("优先级：LOW, MEDIUM, HIGH")
    private Priority priority = Priority.MEDIUM;

    public enum Status {
        OPEN,
        IN_PROGRESS,
        COMPLETED,
        CLOSED
    }

    public enum Priority {
        LOW,
        MEDIUM,
        HIGH
    }

    @PrePersist
    @PreUpdate
    private void normalizeProgressPercent() {
        if (progressPercent == null) {
            progressPercent = 0;
        }
        if (progressPercent < 0) {
            progressPercent = 0;
        } else if (progressPercent > 100) {
            progressPercent = 100;
        }
        if (status == Status.OPEN) {
            progressPercent = 0;
        } else if (status == Status.COMPLETED) {
            progressPercent = 100;
        }
    }
}
