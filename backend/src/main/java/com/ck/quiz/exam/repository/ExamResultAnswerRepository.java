package com.ck.quiz.exam.repository;

import com.ck.quiz.exam.entity.ExamResultAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExamResultAnswerRepository extends JpaRepository<ExamResultAnswer, String> {
}