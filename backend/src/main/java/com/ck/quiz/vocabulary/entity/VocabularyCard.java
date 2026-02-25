package com.ck.quiz.vocabulary.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import java.time.LocalDate;

/**
 * 单词卡片实体
 * 用于艾宾浩斯间隔重复学习系统
 */
@Data
@Entity
@Comment("单词卡片表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "vocabulary_card", indexes = {
        @Index(name = "idx_vocab_next_review", columnList = "next_review_date"),
        @Index(name = "idx_vocab_archived", columnList = "archived"),
        @Index(name = "idx_vocab_tags", columnList = "tags"),
        @Index(name = "idx_vocab_word", columnList = "word")
})
public class VocabularyCard extends Model {

    @Column(length = 128, nullable = false)
    @Comment("单词")
    private String word;

    @Column(columnDefinition = "TEXT")
    @Comment("Markdown格式释义")
    private String mdDefinition;

    @Column(nullable = false, columnDefinition = "DECIMAL(4,2) DEFAULT 2.50")
    @Comment("简易度因子 (1.3 ~ 无穷)")
    private Double easinessFactor = 2.5;

    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    @Comment("复习间隔天数")
    private Integer interval = 0;

    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    @Comment("连续记对次数")
    private Integer repetition = 0;

    @Comment("下次复习日期")
    private LocalDate nextReviewDate;

    @Column(nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    @Comment("是否已归档")
    private Boolean archived = false;

    @Column(length = 256)
    @Comment("分类标签，逗号分隔")
    private String tags;

    @Comment("总复习次数")
    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    private Integer totalReviewCount = 0;

    @Comment("最后一次评分 (0-5)")
    @Column(columnDefinition = "INTEGER")
    private Integer lastScore;

    @Comment("学习时间")
    private LocalDate studiedDate;
}
