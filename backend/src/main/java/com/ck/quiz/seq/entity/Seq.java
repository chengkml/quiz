package com.ck.quiz.seq.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Comment;


/**
 * 序列表
 */
@Data
@NoArgsConstructor
@Entity
@Table(name = "synth_seq")
public class Seq {

    @Id
    @Column(name = "id", length = 64, nullable = false)
    @Comment("id")
    private String id;

    @Column(name = "seq_type", length = 128)
    @Comment("序列类型")
    private String seqType;

    @Column(name = "dayly", length = 8)
    @Comment("是否日更新（0、1）")
    private String dayly;

    @Column(name = "seq_val")
    @Comment("序列值")
    private int seqVal;
}
