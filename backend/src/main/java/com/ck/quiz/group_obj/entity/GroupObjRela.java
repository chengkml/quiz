package com.ck.quiz.group_obj.entity;

import org.hibernate.annotations.Comment;

import com.ck.quiz.group.entity.Group;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Comment("分组-对象关联实体类")
@Entity
@Table(name = "obj_group_obj_rela", uniqueConstraints = @UniqueConstraint(columnNames = { "group_id",
                "obj_id" }), indexes = {
                                @Index(name = "idx_group_obj_rela_group", columnList = "group_id"),
                                @Index(name = "idx_group_obj_rela_obj", columnList = "obj_id")
                })
@Data
public class GroupObjRela {

        @Id
        @Comment("关联记录主键")
        @Column(name = "rela_id", length = 32, nullable = false)
        private String relaId;

        @Comment("分组ID")
        @Column(name = "group_id", length = 32, nullable = false)
        private String groupId;

        @Comment("对象ID")
        @Column(name = "obj_id", length = 32, nullable = false)
        private String objId;

}
