package com.ck.quiz.exam.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "exam_result_answer")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamResultAnswer {

    @Id
    @Column(name = "answer_id", length = 32, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id", nullable = false)
    private ExamResult examResult;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rela_id", nullable = false)
    private ExamQuestion examQuestion;

    @Lob
    @Column(name = "user_answer", columnDefinition = "LONGTEXT")
    private String userAnswer;

    @Column(name = "is_correct", nullable = false)
    private Boolean correct;

    @Column(name = "gain_score", nullable = false)
    private Integer gainScore;
}