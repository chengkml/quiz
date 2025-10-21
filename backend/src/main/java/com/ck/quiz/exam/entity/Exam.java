package com.ck.quiz.exam.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * 试卷信息实体类
 * 用于存储试卷基本信息及与题目的关联
 */
@Entity
@Table(
        name = "exam",
        indexes = {
                @Index(name = "idx_exam_paper_status", columnList = "status"),
                @Index(name = "idx_exam_paper_create_date", columnList = "create_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Exam {

    @Id
    @Column(name = "paper_id", length = 32, nullable = false)
    private String id;

    /**
     * 试卷名称
     */
    @Column(name = "name", length = 128, nullable = false)
    private String name;

    /**
     * 试卷描述
     */
    @Column(name = "description", length = 512)
    private String description;

    /**
     * 总分
     */
    @Column(name = "total_score", nullable = false)
    private Integer totalScore = 100;

    /**
     * 考试时长（分钟）
     */
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
    
    /**
     * 归属学科ID
     */
    @Column(name = "subject_id")
    private Long subjectId;

    /**
     * 状态
     * draft = 草稿
     * published = 已发布
     * archived = 已归档
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private ExamPaperStatus status = ExamPaperStatus.DRAFT;

    /**
     * 与题目的关联
     * 通过中间表存储（包含题目顺序和分值）
     */
    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamQuestion> questions = new ArrayList<>();

    /**
     * 创建时间
     */
    @Column(name = "create_date", updatable = false)
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    @Column(name = "create_user", length = 64, updatable = false)
    private String createUser;

    /**
     * 更新时间
     */
    @Column(name = "update_date")
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    @Column(name = "update_user", length = 64)
    private String updateUser;

    @PrePersist
    public void prePersist() {
        this.createDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.createUser = authentication.getName();
        }
    }

    @PreUpdate
    public void preUpdate() {
        this.updateDate = LocalDateTime.now();
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            this.updateUser = authentication.getName();
        }
    }

    /**
     * 试卷状态枚举
     */
    public enum ExamPaperStatus {
        DRAFT,
        PUBLISHED,
        ARCHIVED
    }
}
