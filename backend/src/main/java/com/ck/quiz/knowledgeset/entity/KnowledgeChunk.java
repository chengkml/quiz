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
        name = "knowledge_chunk",
        indexes = {
                @Index(name = "idx_knowledge_chunk_source_id", columnList = "knowledgeSourceId")
        }
)
public class KnowledgeChunk extends Model {

    @Column(length = 32, nullable = false)
    @Comment("所属来源ID")
    private String knowledgeSourceId;

    @Column(columnDefinition = "TEXT", nullable = false)
    @Comment("切片内容")
    private String content;

    @Column(length = 2048)
    @Comment("元数据(JSON)")
    private String meta;

    @Comment("切片索引/顺序")
    private Integer chunkIndex;

    @Comment("Token数量")
    private Integer tokenCount;
}
