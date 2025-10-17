package com.ck.quiz.todo.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;

/**
 * 待办信息实体类
 */
@Entity
@Table(
        name = "todo",
        indexes = {
                @Index(name = "idx_todo_status", columnList = "status"),
                @Index(name = "idx_todo_priority", columnList = "priority"),
                @Index(name = "idx_todo_due_date", columnList = "due_date"),
                @Index(name = "idx_todo_create_date", columnList = "create_date")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Todo {

    @Id
    @Column(name = "todo_id", length = 32, nullable = false)
    private String id;

    /**
     * 标题
     */
    @Column(name = "title", length = 256, nullable = false)
    private String title;

    /**
     * 详细描述
     */
    @Lob
    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    /**
     * 状态：PENDING, IN_PROGRESS, COMPLETED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    private Status status = Status.PENDING;

    /**
     * 优先级：LOW, MEDIUM, HIGH
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 20, nullable = false)
    private Priority priority = Priority.MEDIUM;

    /**
     * 截止时间
     */
    @Column(name = "due_date")
    private LocalDateTime dueDate;

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

    public enum Status {
        PENDING,
        IN_PROGRESS,
        COMPLETED
    }

    public enum Priority {
        LOW,
        MEDIUM,
        HIGH
    }
}