package com.ck.quiz.tag_obj.entity;

import org.hibernate.annotations.Comment;

import jakarta.persistence.*;
import lombok.Data;

@Comment("标签-对象关联实体类")
@Entity
@Table(name = "obj_tag_obj_rela", uniqueConstraints = @UniqueConstraint(columnNames = { "tag_id",
        "obj_id" }), indexes = {
                @Index(name = "idx_tag_obj_rela_tag", columnList = "tag_id"),
                @Index(name = "idx_tag_obj_rela_obj", columnList = "obj_id")
        })
@Data
public class TagObjRela {

    @Id
    @Comment("关联记录主键")
    @Column(name = "rela_id", length = 32, nullable = false)
    private String relaId;

    @Comment("标签ID")
    @Column(name = "tag_id", length = 32, nullable = false)
    private String tagId;

    @Comment("对象ID")
    @Column(name = "obj_id", length = 32, nullable = false)
    private String objId;

}
