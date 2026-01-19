package com.ck.quiz.mindmap.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import org.hibernate.annotations.Comment;

import com.ck.quiz.base.entity.Model;

/**
 * 思维导图主表实体类
 */
@Entity
@Comment("思维导图主表")
@Table(name = "mind_map", indexes = {
        @Index(name = "idx_mind_map_name", columnList = "map_name"),
        @Index(name = "idx_mind_map_create_date", columnList = "create_date")
})
@Data
@EqualsAndHashCode(callSuper = true)
public class MindMap extends Model {

    @Comment("导图名称")
    @Column(name = "map_name", length = 255, nullable = false)
    private String mapName;

    @Lob
    @Comment("导图描述")
    @Column(name = "descr", columnDefinition = "TEXT")
    private String descr;

    @Lob
    @Comment("导图数据")
    @Column(name = "map_data", columnDefinition = "TEXT")
    private String mapData;

}
