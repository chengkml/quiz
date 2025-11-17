package com.ck.quiz.prompt.repository;

import com.ck.quiz.prompt.entity.PromptTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 提示词模板数据访问层接口
 * 定义提示词模板相关的数据库操作方法
 */
@Repository
public interface PromptTemplateRepository extends JpaRepository<PromptTemplate, Long> {

    /**
     * 根据模板名称查找提示词模板
     *
     * @param name 模板名称
     * @return 提示词模板
     */
    Optional<PromptTemplate> findByName(String name);

    /**
     * 检查模板名称是否存在
     *
     * @param name 模板名称
     * @return 是否存在
     */
    boolean existsByName(String name);

    /**
     * 检查模板名称是否存在（排除指定ID）
     *
     * @param name 模板名称
     * @param id 排除的模板ID
     * @return 是否存在
     */
    boolean existsByNameAndIdNot(String name, Long id);

    /**
     * 根据创建用户查找提示词模板列表
     *
     * @param createUser 创建用户
     * @return 提示词模板列表
     */
    List<PromptTemplate> findByCreateUser(String createUser);

}