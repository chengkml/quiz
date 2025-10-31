package com.ck.quiz.prompt.service.impl;

import com.ck.quiz.prompt.dto.PromptTemplateCreateDto;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.dto.PromptTemplateQueryDto;
import com.ck.quiz.prompt.dto.PromptTemplateUpdateDto;
import com.ck.quiz.prompt.entity.PromptTemplate;
import com.ck.quiz.prompt.exception.PromptTemplateException;
import com.ck.quiz.prompt.repository.PromptTemplateRepository;
import com.ck.quiz.prompt.service.PromptTemplateService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 提示词模板服务实现类
 * 实现提示词模板管理的具体业务逻辑
 */
@Service
@Slf4j
public class PromptTemplateServiceImpl implements PromptTemplateService {

    @Autowired
    private PromptTemplateRepository promptTemplateRepository;

    @Override
    @Transactional
    public PromptTemplateDto createPromptTemplate(PromptTemplateCreateDto createDto) {
        log.info("创建提示词模板: {}", createDto.getName());

        // 检查模板名称是否已存在
        if (checkPromptTemplateNameExists(createDto.getName(), null)) {
            throw new PromptTemplateException("PROMPT_TEMPLATE_NAME_EXISTS", "提示词模板名称已存在: " + createDto.getName());
        }

        // 创建提示词模板实体
        PromptTemplate promptTemplate = new PromptTemplate();
        BeanUtils.copyProperties(createDto, promptTemplate);

        // 保存提示词模板
        PromptTemplate savedTemplate = promptTemplateRepository.save(promptTemplate);
        log.info("提示词模板创建成功，ID: {}", savedTemplate.getId());

        return convertToDto(savedTemplate);
    }

    @Override
    @Transactional
    public PromptTemplateDto updatePromptTemplate(PromptTemplateUpdateDto updateDto) {
        log.info("更新提示词模板: {}", updateDto.getId());

        // 检查提示词模板是否存在
        PromptTemplate existingTemplate = promptTemplateRepository.findById(updateDto.getId())
                .orElseThrow(() -> new PromptTemplateException("PROMPT_TEMPLATE_NOT_FOUND", "提示词模板不存在: " + updateDto.getId()));

        // 检查模板名称是否已被其他模板使用
        if (checkPromptTemplateNameExists(updateDto.getName(), updateDto.getId())) {
            throw new PromptTemplateException("PROMPT_TEMPLATE_NAME_EXISTS", "提示词模板名称已存在: " + updateDto.getName());
        }

        // 更新提示词模板信息
        BeanUtils.copyProperties(updateDto, existingTemplate, "createDate", "createUser");

        // 保存更新
        PromptTemplate updatedTemplate = promptTemplateRepository.save(existingTemplate);
        log.info("提示词模板更新成功，ID: {}", updatedTemplate.getId());

        return convertToDto(updatedTemplate);
    }

    @Override
    @Transactional
    public void deletePromptTemplate(Long id) {
        log.info("删除提示词模板: {}", id);

        // 检查提示词模板是否存在
        if (!promptTemplateRepository.existsById(id)) {
            throw new PromptTemplateException("PROMPT_TEMPLATE_NOT_FOUND", "提示词模板不存在: " + id);
        }

        // 删除提示词模板
        promptTemplateRepository.deleteById(id);
        log.info("提示词模板删除成功，ID: {}", id);
    }

    @Override
    public PromptTemplateDto getPromptTemplateById(Long id) {
        log.info("根据ID获取提示词模板: {}", id);

        PromptTemplate promptTemplate = promptTemplateRepository.findById(id)
                .orElseThrow(() -> new PromptTemplateException("PROMPT_TEMPLATE_NOT_FOUND", "提示词模板不存在: " + id));

        return convertToDto(promptTemplate);
    }

    @Override
    public PromptTemplateDto getPromptTemplateByName(String name) {
        log.info("根据名称获取提示词模板: {}", name);

        PromptTemplate promptTemplate = promptTemplateRepository.findByName(name)
                .orElseThrow(() -> new PromptTemplateException("PROMPT_TEMPLATE_NOT_FOUND", "提示词模板不存在: " + name));

        return convertToDto(promptTemplate);
    }

    @Override
    public Page<PromptTemplateDto> searchPromptTemplates(PromptTemplateQueryDto queryDto) {
        log.info("分页查询提示词模板，查询条件: {}", queryDto);

        // 构建排序参数
        Sort.Direction direction = queryDto.getSortOrder().equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, queryDto.getSortBy());

        // 构建分页参数
        Pageable pageable = PageRequest.of(queryDto.getPageNum() - 1, queryDto.getPageSize(), sort);

        // 执行查询
        Page<PromptTemplate> page;
        if (queryDto.getCreateUser() != null && !queryDto.getCreateUser().isEmpty()) {
            page = promptTemplateRepository.findByNameContainingAndCreateUser(
                    queryDto.getName() != null ? queryDto.getName() : "",
                    queryDto.getCreateUser(),
                    pageable);
        } else {
            page = promptTemplateRepository.findByNameContaining(
                    queryDto.getName() != null ? queryDto.getName() : "",
                    pageable);
        }

        // 转换为DTO
        return page.map(this::convertToDto);
    }

    @Override
    public List<PromptTemplateDto> getAllPromptTemplates() {
        log.info("获取所有提示词模板");

        List<PromptTemplate> templates = promptTemplateRepository.findAll(Sort.by(Sort.Direction.DESC, "createDate"));
        return templates.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public List<PromptTemplateDto> getPromptTemplatesByCreateUser(String createUser) {
        log.info("根据创建用户获取提示词模板: {}", createUser);

        List<PromptTemplate> templates = promptTemplateRepository.findByCreateUser(createUser);
        return templates.stream().map(this::convertToDto).collect(Collectors.toList());
    }

    @Override
    public boolean checkPromptTemplateNameExists(String name, Long excludeId) {
        if (excludeId == null) {
            return promptTemplateRepository.existsByName(name);
        } else {
            return promptTemplateRepository.existsByNameAndIdNot(name, excludeId);
        }
    }

    /**
     * 将实体转换为DTO
     *
     * @param promptTemplate 提示词模板实体
     * @return 提示词模板DTO
     */
    private PromptTemplateDto convertToDto(PromptTemplate promptTemplate) {
        PromptTemplateDto dto = new PromptTemplateDto();
        BeanUtils.copyProperties(promptTemplate, dto);
        return dto;
    }
}