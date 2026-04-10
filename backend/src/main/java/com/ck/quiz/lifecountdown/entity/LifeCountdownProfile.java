package com.ck.quiz.lifecountdown.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Entity
@Comment("生命倒计时配置")
@EqualsAndHashCode(callSuper = true)
@Table(name = "life_countdown_profile", indexes = {
        @Index(name = "idx_life_countdown_profile_death_date", columnList = "death_date")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_life_countdown_profile_user", columnNames = "create_user")
})
public class LifeCountdownProfile extends Model {

    @Column(name = "death_date")
    @Comment("死亡日期")
    private LocalDate deathDate;

    @Column(name = "today_warning_date")
    @Comment("今日警示语对应日期")
    private LocalDate todayWarningDate;

    @Column(name = "today_warning_text", columnDefinition = "TEXT")
    @Comment("今日警示语内容")
    private String todayWarningText;

    @Column(name = "today_warning_generated_at")
    @Comment("今日警示语生成时间")
    private LocalDateTime todayWarningGeneratedAt;

    @Column(name = "today_warning_model", length = 128)
    @Comment("今日警示语生成模型")
    private String todayWarningModel;
}
