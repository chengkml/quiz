package com.ck.quiz.prompt.service;

import com.ck.quiz.prompt.dto.PromptTemplateCreateDto;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.dto.PromptTemplateQueryDto;
import com.ck.quiz.prompt.dto.PromptTemplateUpdateDto;
import org.springframework.data.domain.Page;

import java.util.List;

/**
 * 提示词模板服务接口
 * 定义提示词模板管理的核心业务操作
 */
public interface PromptTemplateService {

    /**
     * 创建新提示词模板
     *
     * @param createDto 提示词模板创建信息
     * @return 创建的提示词模板信息
     */
    PromptTemplateDto createPromptTemplate(PromptTemplateCreateDto createDto);

    /**
     * 更新提示词模板信息
     *
     * @param updateDto 提示词模板更新信息
     * @return 更新后的提示词模板信息
     */
    PromptTemplateDto updatePromptTemplate(PromptTemplateUpdateDto updateDto);

    /**
     * 删除提示词模板
     *
     * @param id 提示词模板ID
     */
    void deletePromptTemplate(Long id);

    /**
     * 根据ID获取提示词模板信息
     *
     * @param id 提示词模板ID
     * @return 提示词模板信息
     */
    PromptTemplateDto getPromptTemplateById(Long id);

    /**
     * 根据名称获取提示词模板信息
     *
     * @param name 提示词模板名称
     * @return 提示词模板信息
     */
    PromptTemplateDto getPromptTemplateByName(String name);

    /**
     * 分页查询提示词模板
     *
     * @param queryDto 查询条件
     * @return 分页提示词模板列表
     */
    Page<PromptTemplateDto> searchPromptTemplates(PromptTemplateQueryDto queryDto);

    /**
     * 获取所有提示词模板
     *
     * @return 所有提示词模板列表
     */
    List<PromptTemplateDto> getAllPromptTemplates();

    /**
     * 根据创建用户获取提示词模板列表
     *
     * @param createUser 创建用户
     * @return 提示词模板列表
     */
    List<PromptTemplateDto> getPromptTemplatesByCreateUser(String createUser);

    /**
     * 检查提示词模板名称是否存在
     *
     * @param name 模板名称
     * @param excludeId 排除的ID
     * @return 是否存在
     */
    boolean checkPromptTemplateNameExists(String name, Long excludeId);
}