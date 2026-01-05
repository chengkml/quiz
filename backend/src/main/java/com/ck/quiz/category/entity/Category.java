package com.ck.quiz.category.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import org.hibernate.annotations.Comment;

import com.ck.quiz.base.entity.Model;

@Data
@Entity
@Comment("目录实体类")
@EqualsAndHashCode(callSuper = true)
@Table(name = "category", indexes = {
        @Index(name = "idx_category_name", columnList = "name"),
        @Index(name = "idx_category_parent_id", columnList = "parent_id"),
        @Index(name = "idx_category_subject_id", columnList = "subject_id"),
        @Index(name = "idx_category_create_date", columnList = "create_date")
})
public class Category extends Model {

    @Column(name = "name", length = 64, nullable = false)
    @Comment("目录名称")
    private String name;

    @Column(name = "parent_id", length = 32)
    @Comment("父目录 ID（顶级目录为 null）")
    private String parentId;

    @Column(name = "subject_id", length = 32, nullable = false)
    @Comment("所属主题 ID")
    private String subjectId;

    @Column(name = "descr", length = 255)
    @Comment("描述")
    private String descr;

}
