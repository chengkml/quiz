package com.ck.quiz.codereview.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("代码评审问题")
@EqualsAndHashCode(callSuper = true)
@Table(name = "code_review_issue", indexes = {
        @Index(name = "idx_cri_project", columnList = "projectName"),
        @Index(name = "idx_cri_module", columnList = "moduleName"),
        @Index(name = "idx_cri_status", columnList = "status"),
        @Index(name = "idx_cri_severity", columnList = "severity"),
        @Index(name = "idx_cri_task_id", columnList = "taskId")
})
public class CodeReviewIssue extends Model {

    @Column(length = 32)
    @Comment("所属评审任务ID")
    private String taskId;

    @Column(length = 256, nullable = false)
    @Comment("问题标题")
    private String title;

    @Column(length = 128)
    @Comment("项目名")
    private String projectName;

    @Column(length = 128)
    @Comment("模块名")
    private String moduleName;

    @Column(length = 512)
    @Comment("文件路径")
    private String filePath;

    @Column
    @Comment("行号")
    private Integer lineNo;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("严重级别")
    private Severity severity = Severity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("问题状态")
    private Status status = Status.OPEN;

    @Column(length = 64)
    @Comment("来源")
    private String source = "OPENCLAW";

    @Column(columnDefinition = "TEXT")
    @Comment("问题描述")
    private String issueDetail;

    @Column(columnDefinition = "TEXT")
    @Comment("评审建议")
    private String suggestion;

    @Column(length = 32)
    @Comment("转需求后的需求ID")
    private String requirementId;

    public enum Severity {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }

    public enum Status {
        OPEN,
        TRIAGED,
        CONVERTED,
        RESOLVED,
        IGNORED
    }
}
