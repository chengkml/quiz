package com.ck.quiz.exam.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "exam_result")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExamResult {

    @Id
    @Column(name = "result_id", length = 32, nullable = false)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paper_id", nullable = false)
    private Exam exam;

    @Column(name = "user_id", length = 64, nullable = false)
    private String userId;

    @Column(name = "total_score", nullable = false)
    private Integer totalScore;

    @Column(name = "correct_count", nullable = false)
    private Integer correctCount;

    @Column(name = "submit_time", nullable = false)
    private LocalDateTime submitTime;

    @OneToMany(mappedBy = "examResult", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExamResultAnswer> answers = new ArrayList<>();
}