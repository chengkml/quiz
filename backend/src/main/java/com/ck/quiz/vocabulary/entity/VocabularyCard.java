package com.ck.quiz.vocabulary.entity;

import com.ck.quiz.base.entity.ReviewModel;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

/**
 * 单词卡片实体
 */
@Data
@Entity
@Comment("单词卡片表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "vocabulary_card", indexes = {
        @Index(name = "idx_vocab_word", columnList = "word")
})
public class VocabularyCard extends ReviewModel {

    @Column(length = 128, nullable = false)
    @Comment("单词")
    private String word;

    @Column(columnDefinition = "TEXT")
    @Comment("Markdown格式释义")
    private String mdDefinition;

}
