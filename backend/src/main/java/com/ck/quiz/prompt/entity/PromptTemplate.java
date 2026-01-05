package com.ck.quiz.prompt.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

@Data
@Entity
@Comment("提示词模板表")
@EqualsAndHashCode(callSuper = true)
@Table(name = "prompt_templates")
public class PromptTemplate extends Model {

    @Column(length = 255, nullable = false)
    @Comment("模板名称")
    private String name;

    @Column(columnDefinition = "TEXT", nullable = false)
    @Comment("模板内容")
    private String content;

    @Column(columnDefinition = "TEXT")
    @Comment("模板描述")
    private String description;
}