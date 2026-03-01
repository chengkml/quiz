package com.ck.quiz.poetry.entity;

import com.ck.quiz.base.entity.ReviewModel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

/**
 * 诗词卡片实体
 */
@Data
@Entity
@Comment("诗词卡片表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "poetry_card", indexes = {
        @Index(name = "idx_poetry_title", columnList = "title"),
        @Index(name = "idx_poetry_author", columnList = "author")
})
public class PoetryCard extends ReviewModel {

    @Column(length = 128, nullable = false)
    @Comment("诗词标题")
    private String title;

    @Column(length = 64)
    @Comment("作者")
    private String author;

    @Column(length = 32)
    @Comment("朝代")
    private String dynasty;

    @Column(columnDefinition = "TEXT")
    @Comment("诗词正文")
    private String content;

    @Column(columnDefinition = "TEXT")
    @Comment("诗词赏析（Markdown）")
    private String mdAnalysis;
}
