package com.ck.quiz.llmmodel.repository;

import com.ck.quiz.llmmodel.entity.LLMModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 大语言模型数据访问接口
 */
@Repository
public interface LLMModelRepository extends JpaRepository<LLMModel, String> {

    /**
     * 根据是否为默认模型查询
     * @param isDefault 是否为默认模型
     * @return 默认模型（最多一个）
     */
    Optional<LLMModel> findByIsDefault(String isDefault);

    /**
     * 根据模型名称和提供商查询
     * @param name 模型名称
     * @param provider 模型提供商
     * @return 模型实体
     */
    Optional<LLMModel> findByNameAndProvider(String name, String provider);

    Optional<LLMModel> findByName(String name);

    /**
     * 根据模型类型和默认标志查询
     * @param type 模型类型
     * @param isDefault 是否为默认模型
     * @return 指定类型的默认模型
     */
    Optional<LLMModel> findByTypeAndIsDefault(LLMModel.ModelType type, String isDefault);
}