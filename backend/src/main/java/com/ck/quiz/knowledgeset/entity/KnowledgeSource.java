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
        name = "knowledge_source",
        indexes = {
                @Index(name = "idx_knowledge_source_set_id", columnList = "knowledgeSetId"),
                @Index(name = "idx_knowledge_source_name", columnList = "name")
        }
)
public class KnowledgeSource extends Model {

    @Column(length = 32, nullable = false)
    @Comment("所属知识集ID")
    private String knowledgeSetId;

    @Column(length = 128, nullable = false)
    @Comment("来源名称/文件名")
    private String name;

    @Column(length = 32)
    @Comment("来源类型：FILE, DB")
    private String type;

    @Column(length = 32)
    @Comment("状态：PENDING, PARSING, SUCCESS, FAILED")
    private String status;

    @Column(length = 512)
    @Comment("文件存储路径或连接串")
    private String content;

    @Column(columnDefinition = "TEXT")
    @Comment("扩展信息")
    private String meta;

    @Column(length = 512)
    @Comment("描述")
    private String descr;

    @Column(length = 256)
    @Comment("标签")
    private String tags;

    @Column(length = 32)
    @Comment("语言")
    private String language;
}
