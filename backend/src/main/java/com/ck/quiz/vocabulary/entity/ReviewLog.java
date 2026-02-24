package com.ck.quiz.vocabulary.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

/**
 * 复习记录实体
 * 记录每次复习的详细信息和算法参数变化
 */
@Data
@Entity
@Comment("复习记录表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "review_log", indexes = {
        @Index(name = "idx_review_card_id", columnList = "vocabulary_card_id"),
        @Index(name = "idx_review_date", columnList = "review_date")
})
public class ReviewLog extends Model {

    @Column(name = "vocabulary_card_id", length = 32, nullable = false)
    @Comment("单词卡片ID")
    private String vocabularyCardId;

    @Comment("复习时间")
    @Column(nullable = false)
    private LocalDateTime reviewDate;

    @Column(nullable = false)
    @Comment("评分 (0-5)")
    private Integer score;

    @Column(nullable = false, columnDefinition = "DECIMAL(4,2)")
    @Comment("复习前简易度因子")
    private Double efBefore;

    @Column(nullable = false, columnDefinition = "DECIMAL(4,2)")
    @Comment("复习后简易度因子")
    private Double efAfter;

    @Column(nullable = false)
    @Comment("下次复习间隔天数")
    private Integer nextIntervalDays;
}
