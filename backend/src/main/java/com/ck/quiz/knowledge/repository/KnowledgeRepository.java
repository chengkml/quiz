package com.ck.quiz.knowledge.repository;

import com.ck.quiz.knowledge.entity.Knowledge;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 知识点数据访问层
 * 定义知识点相关的数据访问方法
 */
@Repository
public interface KnowledgeRepository extends JpaRepository<Knowledge, String> {

    /**
     * 根据名称查找知识点
     *
     * @param name 知识点名称
     * @return 知识点信息
     */
    Optional<Knowledge> findByName(String name);

    /**
     * 检查知识点名称是否存在
     *
     * @param name 知识点名称
     * @return 是否存在
     */
    boolean existsByName(String name);

    /**
     * 检查知识点名称是否存在（排除指定ID）
     *
     * @param name 知识点名称
     * @param id 排除的知识点ID
     * @return 是否存在
     */
    boolean existsByNameAndIdNot(String name, String id);

    /**
     * 根据学科ID查找知识点列表
     *
     * @param subjectId 学科ID
     * @return 知识点列表
     */
    List<Knowledge> findBySubjectId(String subjectId);

    /**
     * 根据分类ID查找知识点列表
     *
     * @param categoryId 分类ID
     * @return 知识点列表
     */
    List<Knowledge> findByCategoryId(String categoryId);

    /**
     * 根据难度等级查找知识点列表
     *
     * @param difficultyLevel 难度等级
     * @return 知识点列表
     */
    List<Knowledge> findByDifficultyLevel(Integer difficultyLevel);

    /**
     * 根据学科ID和分类ID查找知识点列表
     *
     * @param subjectId 学科ID
     * @param categoryId 分类ID
     * @return 知识点列表
     */
    List<Knowledge> findBySubjectIdAndCategoryId(String subjectId, String categoryId);

    /**
     * 根据学科ID和难度等级查找知识点列表
     *
     * @param subjectId 学科ID
     * @param difficultyLevel 难度等级
     * @return 知识点列表
     */
    List<Knowledge> findBySubjectIdAndDifficultyLevel(String subjectId, Integer difficultyLevel);

    /**
     * 根据分类ID和难度等级查找知识点列表
     *
     * @param categoryId 分类ID
     * @param difficultyLevel 难度等级
     * @return 知识点列表
     */
    List<Knowledge> findByCategoryIdAndDifficultyLevel(String categoryId, Integer difficultyLevel);

    /**
     * 根据学科ID、分类ID和难度等级查找知识点列表
     *
     * @param subjectId 学科ID
     * @param categoryId 分类ID
     * @param difficultyLevel 难度等级
     * @return 知识点列表
     */
    List<Knowledge> findBySubjectIdAndCategoryIdAndDifficultyLevel(String subjectId, String categoryId, Integer difficultyLevel);

    /**
     * 根据条件分页查询知识点
     *
     * @param name 知识点名称（模糊查询）
     * @param categoryId 分类ID
     * @param subjectId 学科ID
     * @param difficultyLevel 难度等级
     * @param pageable 分页参数
     * @return 分页知识点列表
     */
    @Query("SELECT k FROM Knowledge k WHERE " +
           "(:name IS NULL OR k.name LIKE %:name%) AND " +
           "(:categoryId IS NULL OR k.categoryId = :categoryId) AND " +
           "(:subjectId IS NULL OR k.subjectId = :subjectId) AND " +
           "(:difficultyLevel IS NULL OR k.difficultyLevel = :difficultyLevel)")
    Page<Knowledge> findByConditions(@Param("name") String name,
                                   @Param("categoryId") String categoryId,
                                   @Param("subjectId") String subjectId,
                                   @Param("difficultyLevel") Integer difficultyLevel,
                                   Pageable pageable);

}