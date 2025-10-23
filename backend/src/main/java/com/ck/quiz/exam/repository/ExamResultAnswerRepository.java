package com.ck.quiz.exam.repository;

import com.ck.quiz.exam.entity.ExamResultAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExamResultAnswerRepository extends JpaRepository<ExamResultAnswer, String> {
    /**
     * 根据结果ID查询答题详情
     */
    List<ExamResultAnswer> findByExamResult_Id(String resultId);
}