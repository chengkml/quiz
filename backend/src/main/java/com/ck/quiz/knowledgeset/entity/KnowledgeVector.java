package com.ck.quiz.knowledgeset.entity;

import com.ck.quiz.base.entity.Model;
import com.ck.quiz.knowledgeset.converter.VectorConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import java.util.List;

@Data
@Entity
@EqualsAndHashCode(callSuper = true)
@Table(name = "knowledge_vector", indexes = {
                @Index(name = "idx_knowledge_vector_chunk_id", columnList = "knowledgeChunkId")
})
public class KnowledgeVector extends Model {

        @Column(length = 32, nullable = false)
        @Comment("所属切片ID")
        private String knowledgeChunkId;

        @Column(columnDefinition = "vector")
        @Convert(converter = VectorConverter.class)
        @org.hibernate.annotations.ColumnTransformer(write = "?::vector")
        @Comment("向量数据")
        private List<Double> embedding;

        @Column(length = 64)
        @Comment("嵌入模型名称")
        private String model;

        @Comment("维度")
        private Integer dimension;
}
