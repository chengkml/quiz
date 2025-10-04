package com.ck.quiz.exam.repository;

import com.ck.quiz.exam.entity.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 试卷题目关系数据访问接口
 */
@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, String> {

    /**
     * 根据试卷ID查找所有题目关系
     *
     * @param examId 试卷ID
     * @return 试卷题目关系列表
     */
    List<ExamQuestion> findByExamIdOrderByOrderNo(String examId);

    /**
     * 根据试卷ID删除所有题目关系
     *
     * @param examId 试卷ID
     */
    void deleteByExamId(String examId);
}