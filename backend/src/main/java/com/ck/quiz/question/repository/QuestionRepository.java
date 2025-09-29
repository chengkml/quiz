package com.ck.quiz.question.repository;

import com.ck.quiz.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 题目数据访问接口
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {

}