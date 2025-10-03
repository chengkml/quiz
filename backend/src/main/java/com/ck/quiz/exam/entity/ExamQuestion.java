package com.ck.quiz.exam.entity;

import com.ck.quiz.question.entity.Question;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 试卷-题目关系表
 * 存储试卷中的题目顺序及分值
 */
@Entity
@Table(name = "exam_paper_question")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamQuestion {

    @Id
    @Column(name = "rela_id", length = 32, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    /**
     * 题目顺序
     */
    @Column(name = "order_no", nullable = false)
    private Integer orderNo;

    /**
     * 分值
     */
    @Column(name = "score", nullable = false)
    private Integer score;
}
