package com.ck.quiz.diary.entity;

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

import java.time.LocalDate;

@Data
@Entity
@Comment("日记表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "diary", indexes = {
        @Index(name = "idx_diary_create_user", columnList = "create_user"),
        @Index(name = "idx_diary_diary_date", columnList = "diary_date"),
        @Index(name = "idx_diary_mood", columnList = "mood"),
        @Index(name = "idx_diary_archived", columnList = "archived")
})
public class Diary extends Model {

    @Column(length = 256, nullable = false)
    @Comment("标题")
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    @Comment("正文")
    private String content;

    @Column(nullable = false)
    @Comment("日记日期")
    private LocalDate diaryDate = LocalDate.now();

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    @Comment("心情")
    private Mood mood = Mood.CALM;

    @Column(length = 64)
    @Comment("天气")
    private String weather;

    @Column(nullable = false)
    @Comment("是否归档")
    private Boolean archived = false;

    public enum Mood {
        HAPPY,
        CALM,
        SAD,
        ANGRY,
        TIRED,
        EXCITED
    }
}
