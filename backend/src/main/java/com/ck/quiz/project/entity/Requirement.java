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
}
