package com.ck.quiz.todo.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;
import java.time.LocalDateTime;

@Data
@Entity
@Comment("待办表")
@EqualsAndHashCode(callSuper = true)
@Table(
        name = "todo",
        indexes = {
                @Index(name = "idx_todo_status", columnList = "status"),
                @Index(name = "idx_todo_priority", columnList = "priority"),
                @Index(name = "idx_todo_due_date", columnList = "due_date")
        }
)
public class Todo extends Model {

    @Column(length = 256, nullable = false)
    @Comment("标题")
    private String title;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    @Comment("详细描述")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("状态")
    private Status status = Status.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("优先级")
    private Priority priority = Priority.MEDIUM;

    @Comment("截止时间")
    private LocalDateTime dueDate;

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