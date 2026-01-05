package com.ck.quiz.subject.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import org.hibernate.annotations.Comment;

import com.ck.quiz.base.entity.Model;

@Data
@Entity
@Comment("主题表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "subject", uniqueConstraints = {
        @UniqueConstraint(name = "uk_subject_name_create_user", columnNames = { "name", "create_user" })
})
public class Subject extends Model {

    @Column(length = 64, nullable = false)
    @Comment("主题英文名")
    private String name;

    @Column(length = 128, nullable = false)
    @Comment("主题中文名")
    private String label;

    @Column(length = 512)
    @Comment("主题描述")
    private String descr;

}
