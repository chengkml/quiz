package com.ck.quiz.group.entity;

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
@Comment("分组表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "obj_group", indexes = {
    @Index(name = "idx_group_name_create_user", columnList = "name,create_user", unique = true)
})
public class Group extends Model {

    @Comment("分组英文名")
    @Column(nullable = false, length = 128)
    private String name;

    @Comment("分组中文名")
    @Column(nullable = false, length = 256)
    private String label;

    @Comment("分组类型")
    @Column(length = 64)
    private String type;

    @Comment("分组描述")
    @Column(length = 512)
    private String descr;

}