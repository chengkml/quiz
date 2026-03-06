package com.ck.quiz.homework.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("作业表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "homework", indexes = {
        @Index(name = "idx_hw_status", columnList = "status"),
        @Index(name = "idx_hw_title", columnList = "title")
})
public class Homework extends Model {

    @Column(length = 256, nullable = false)
    @Comment("作业标题")
    private String title;

    @Column(columnDefinition = "TEXT")
    @Comment("作业内容(Markdown)")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("作业状态")
    private Status status = Status.NOT_STARTED;

    public enum Status {
        NOT_STARTED,
        IN_PROGRESS,
        COMPLETED
    }
}
