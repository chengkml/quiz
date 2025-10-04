package com.ck.quiz.exam.repository;

import com.ck.quiz.exam.entity.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 试卷数据访问接口
 */
@Repository
public interface ExamRepository extends JpaRepository<Exam, String> {

}