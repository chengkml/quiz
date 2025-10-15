package com.ck.quiz.exam.repository;

import com.ck.quiz.exam.entity.ExamResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamResultRepository extends JpaRepository<ExamResult, String> {
    java.util.List<ExamResult> findByUserIdOrderBySubmitTimeDesc(String userId);
    java.util.List<ExamResult> findByUserIdAndExam_IdOrderBySubmitTimeDesc(String userId, String examId);
}