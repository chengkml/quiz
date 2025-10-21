package com.ck.quiz.llmmodel.service;

import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 大语言模型管理服务接口
 * <p>
 * 定义了模型相关的核心业务操作，包括增删改查、分页查询等。
 * 实现类通常会调用数据库访问层（Repository）来完成具体逻辑。
 */
public interface LLMModelService {

    /**
     * 创建模型
     *
     * @param modelCreateDto 模型创建信息
     * @return 创建成功后的模型信息
     */
    LLMModelDto createModel(LLMModelCreateDto modelCreateDto);

    /**
     * 更新模型
     *
     * @param modelUpdateDto 模型更新信息
     * @return 更新后的模型信息
     */
    LLMModelDto updateModel(LLMModelUpdateDto modelUpdateDto);

    /**
     * 删除模型
     *
     * @param modelId 模型ID
     * @return 被删除的模型信息
     */
    LLMModelDto deleteModel(String modelId);

    /**
     * 根据ID获取模型信息
     *
     * @param modelId 模型ID
     * @return 对应的模型信息
     */
    LLMModelDto getModelById(String modelId);

    /**
     * 获取默认模型
     *
     * @return 默认模型信息
     */
    LLMModelDto getDefaultModel();

    /**
     * 分页查询模型
     *
     * @param queryDto 查询条件
     * @return 分页查询结果
     */
    Page<LLMModelDto> searchModels(LLMModelQueryDto queryDto);

    /**
     * 获取所有激活状态的模型列表
     *
     * @return 激活状态的模型列表
     */
    List<LLMModelDto> getActiveModels();

    /**
     * 设置默认模型
     *
     * @param modelId 模型ID
     */
    void setDefaultModel(String modelId);
}