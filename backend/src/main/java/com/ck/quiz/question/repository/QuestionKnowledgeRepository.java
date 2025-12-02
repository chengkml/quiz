package com.ck.quiz.question.repository;

import com.ck.quiz.knowledge.entity.Knowledge;
import com.ck.quiz.question.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 问题-知识点关联关系数据访问层
 */
@Repository
public interface QuestionKnowledgeRepository extends JpaRepository<Question, String> {

    /**
     * 根据问题ID查询关联的知识点
     *
     * @param questionId 问题ID
     * @return 知识点列表
     */
    @Query("SELECT q.knowledgePoints FROM Question q WHERE q.id = :questionId")
    List<Knowledge> findKnowledgeByQuestionId(@Param("questionId") String questionId);

    /**
     * 根据知识点ID查询关联的问题
     *
     * @param knowledgeId 知识点ID
     * @return 问题列表
     */
    @Query("SELECT q FROM Question q JOIN q.knowledgePoints k WHERE k.id = :knowledgeId")
    List<Question> findQuestionsByKnowledgeId(@Param("knowledgeId") String knowledgeId);

}