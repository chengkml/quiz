package com.ck.quiz.character.entity;

import com.ck.quiz.base.entity.ReviewModel;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

/**
 * 生字卡片实体
 */
@Data
@Entity
@Comment("生字卡片表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "character_card", indexes = {
        @Index(name = "idx_character_text", columnList = "characterText")
})
public class CharacterCard extends ReviewModel {

    @Column(length = 128, nullable = false)
    @Comment("生字")
    private String characterText;

    @Column(length = 128)
    @Comment("拼音")
    private String pinyin;

    @Column(columnDefinition = "TEXT")
    @Comment("Markdown格式释义")
    private String mdDefinition;
}
