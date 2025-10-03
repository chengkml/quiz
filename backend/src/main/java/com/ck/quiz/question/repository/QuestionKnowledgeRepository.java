package com.ck.quiz.question.repository;

import com.ck.quiz.question.entity.Question;
import com.ck.quiz.knowledge.entity.Knowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

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

    /**
     * 检查问题和知识点是否已关联
     *
     * @param questionId 问题ID
     * @param knowledgeId 知识点ID
     * @return 是否已关联
     */
    @Query("SELECT COUNT(q) > 0 FROM Question q JOIN q.knowledgePoints k WHERE q.id = :questionId AND k.id = :knowledgeId")
    boolean existsAssociation(@Param("questionId") String questionId, @Param("knowledgeId") String knowledgeId);

    /**
     * 删除问题和知识点的关联关系
     *
     * @param questionId 问题ID
     * @param knowledgeId 知识点ID
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM question_knowledge_rela WHERE question_id = :questionId AND kp_id = :knowledgeId", nativeQuery = true)
    void deleteAssociation(@Param("questionId") String questionId, @Param("knowledgeId") String knowledgeId);

    /**
     * 删除问题的所有知识点关联
     *
     * @param questionId 问题ID
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM question_knowledge_rela WHERE question_id = :questionId", nativeQuery = true)
    void deleteAllAssociationsByQuestionId(@Param("questionId") String questionId);

    /**
     * 删除知识点的所有问题关联
     *
     * @param knowledgeId 知识点ID
     */
    @Modifying
    @Transactional
    @Query(value = "DELETE FROM question_knowledge_rela WHERE kp_id = :knowledgeId", nativeQuery = true)
    void deleteAllAssociationsByKnowledgeId(@Param("knowledgeId") String knowledgeId);
}