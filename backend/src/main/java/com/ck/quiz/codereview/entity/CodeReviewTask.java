package com.ck.quiz.codereview.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import org.springframework.util.StringUtils;

@Data
@Entity
@Comment("代码评审任务")
@EqualsAndHashCode(callSuper = true)
@Table(name = "code_review_task", indexes = {
        @Index(name = "idx_crt_project", columnList = "projectName"),
        @Index(name = "idx_crt_status", columnList = "status"),
        @Index(name = "idx_crt_target_page", columnList = "targetPage")
})
public class CodeReviewTask extends Model {

    public static final String DEFAULT_BRANCH = "main";
    public static final String DEFAULT_REVIEW_STANDARD = "DUOWENSPEC";

    @Column(length = 256, nullable = false)
    @Comment("任务标题")
    private String title;

    @Column(length = 128)
    @Comment("项目名称")
    private String projectName;

    @Column(length = 512)
    @Comment("Git 仓库地址")
    private String gitUrl;

    @Column(length = 128)
    @Comment("分支名称")
    private String branch = DEFAULT_BRANCH;

    @Column(length = 256, nullable = false)
    @Comment("目标页面")
    private String targetPage;

    @Column(length = 64, nullable = false)
    @Comment("评审规范")
    private String reviewStandard = DEFAULT_REVIEW_STANDARD;

    @Column(columnDefinition = "TEXT")
    @Comment("任务描述")
    private String descr;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("任务状态")
    private Status status = Status.OPEN;

    public enum Status {
        OPEN,
        IN_PROGRESS,
        COMPLETED,
        CLOSED
    }

    @PrePersist
    @PreUpdate
    private void normalize() {
        if (!StringUtils.hasText(branch)) {
            branch = DEFAULT_BRANCH;
        } else {
            branch = branch.trim();
        }
        if (!StringUtils.hasText(reviewStandard)) {
            reviewStandard = DEFAULT_REVIEW_STANDARD;
        } else {
            reviewStandard = reviewStandard.trim();
        }
        if (status == null) {
            status = Status.OPEN;
        }
    }
}
