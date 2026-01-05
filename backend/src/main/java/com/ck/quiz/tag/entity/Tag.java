package com.ck.quiz.tag.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("标签表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "tag", uniqueConstraints = {
        @UniqueConstraint(name = "uk_tag_name_create_user", columnNames = { "name", "create_user" }),
        @UniqueConstraint(name = "uk_tag_label_create_user", columnNames = { "label", "create_user" })
})
public class Tag extends Model {

    @Column(length = 128, nullable = false)
    @Comment("标签英文名")
    private String name;

    @Column(length = 256, nullable = false)
    @Comment("标签中文名")
    private String label;

    @Column(length = 512)
    @Comment("标签描述")
    private String descr;

    @Column(length = 32)
    @Comment("标签颜色")
    private String color;
}
