package com.ck.quiz.category.repository;

import com.ck.quiz.category.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 分类数据访问层接口
 * 定义分类相关的数据库操作方法
 */
@Repository
public interface CategoryRepository extends JpaRepository<Category, String> {

    /**
     * 根据分类名称查找分类
     *
     * @param name 分类名称
     * @return 分类信息
     */
    Optional<Category> findByName(String name);

    /**
     * 检查分类名称是否存在
     *
     * @param name 分类名称
     * @return 是否存在
     */
    boolean existsByName(String name);

    /**
     * 检查分类名称是否存在（排除指定ID）
     *
     * @param name 分类名称
     * @param id 排除的分类ID
     * @return 是否存在
     */
    boolean existsByNameAndIdNot(String name, String id);

    /**
     * 根据学科ID查找分类列表
     *
     * @param subjectId 学科ID
     * @return 分类列表
     */
    List<Category> findBySubjectId(String subjectId);

    /**
     * 根据父分类ID查找子分类列表
     *
     * @param parentId 父分类ID
     * @return 子分类列表
     */
    List<Category> findByParentId(String parentId);

    /**
     * 根据层级查找分类列表
     *
     * @param level 分类层级
     * @return 分类列表
     */
    List<Category> findByLevel(Integer level);

    /**
     * 根据学科ID和层级查找分类列表
     *
     * @param subjectId 学科ID
     * @param level 分类层级
     * @return 分类列表
     */
    List<Category> findBySubjectIdAndLevel(String subjectId, Integer level);

    /**
     * 根据父分类ID和层级查找分类列表
     *
     * @param parentId 父分类ID
     * @param level 分类层级
     * @return 分类列表
     */
    List<Category> findByParentIdAndLevel(String parentId, Integer level);

    /**
     * 根据学科ID和父分类ID查找分类列表
     *
     * @param subjectId 学科ID
     * @param parentId 父分类ID
     * @return 分类列表
     */
    List<Category> findBySubjectIdAndParentId(String subjectId, String parentId);

}