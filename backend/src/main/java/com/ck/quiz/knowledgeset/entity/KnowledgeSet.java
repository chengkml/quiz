package com.ck.quiz.knowledgeset.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@EqualsAndHashCode(callSuper = true)
@Table(
        name = "knowledge_set",
        indexes = {
                @Index(name = "idx_knowledge_set_name", columnList = "name")
        }
)
public class KnowledgeSet extends Model {

    @Column(length = 128, nullable = false)
    @Comment("知识集名称")
    private String name;

    @Column(length = 512)
    @Comment("知识集描述")
    private String descr;

    @Column(length = 256)
    @Comment("标签，逗号分隔")
    private String tags;

    @Column(length = 32)
    @Comment("可见性")
    private String visibility;

    @Column(length = 32)
    @Comment("默认语言")
    private String defaultLanguage;

    @Column(length = 20)
    @Comment("状态")
    private String status;
}

