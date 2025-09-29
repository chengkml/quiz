package com.ck.quiz.question.repository;

import com.ck.quiz.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 题目数据访问接口
 */
@Repository
public interface QuestionRepository extends JpaRepository<Question, String> {

    /**
     * 根据题目类型查找题目列表
     *
     * @param type 题目类型
     * @return 题目列表
     */
    List<Question> findByType(Question.QuestionType type);

    /**
     * 根据难度等级查找题目列表
     *
     * @param difficultyLevel 难度等级
     * @return 题目列表
     */
    List<Question> findByDifficultyLevel(Integer difficultyLevel);

    /**
     * 根据题目类型和难度等级查找题目列表
     *
     * @param type            题目类型
     * @param difficultyLevel 难度等级
     * @return 题目列表
     */
    List<Question> findByTypeAndDifficultyLevel(Question.QuestionType type, Integer difficultyLevel);

    /**
     * 根据创建人查找题目列表
     *
     * @param createUser 创建人
     * @return 题目列表
     */
    List<Question> findByCreateUser(String createUser);

    /**
     * 根据题干内容模糊查询题目列表
     *
     * @param content 题干内容关键字
     * @return 题目列表
     */
    @Query("SELECT q FROM Question q WHERE q.content LIKE %:content%")
    List<Question> findByContentContaining(@Param("content") String content);

    /**
     * 统计指定类型的题目数量
     *
     * @param type 题目类型
     * @return 题目数量
     */
    long countByType(Question.QuestionType type);

    /**
     * 统计指定难度等级的题目数量
     *
     * @param difficultyLevel 难度等级
     * @return 题目数量
     */
    long countByDifficultyLevel(Integer difficultyLevel);
}