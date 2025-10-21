package com.ck.quiz.llmmodel.service.impl;

import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
import com.ck.quiz.llmmodel.service.LLMModelService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 大语言模型管理服务实现类
 */
@Service
public class LLMModelServiceImpl implements LLMModelService {

    @Autowired
    private LLMModelRepository modelRepository;

    @Override
    @Transactional
    public LLMModelDto createModel(LLMModelCreateDto modelCreateDto) {
        // 检查是否已存在同名同提供商的模型
        Optional<LLMModel> existingModel = modelRepository.findByNameAndProvider(
                modelCreateDto.getName(), modelCreateDto.getProvider());
        if (existingModel.isPresent()) {
            throw new RuntimeException("已存在同名同提供商的模型");
        }

        LLMModel model = new LLMModel();
        BeanUtils.copyProperties(modelCreateDto, model);
        model.setId(UUID.randomUUID().toString().replace("-", "").substring(0, 32));
        model.setStatus(LLMModel.ModelStatus.ACTIVE);

        // 如果设置为默认模型，需要将其他模型的默认标志取消
        if (modelCreateDto.getIsDefault()) {
            resetDefaultModel();
        }

        LLMModel savedModel = modelRepository.save(model);
        return convertToDto(savedModel);
    }

    @Override
    @Transactional
    public LLMModelDto updateModel(LLMModelUpdateDto modelUpdateDto) {
        Optional<LLMModel> optionalModel = modelRepository.findById(modelUpdateDto.getId());
        if (!optionalModel.isPresent()) {
            throw new RuntimeException("模型不存在");
        }

        LLMModel model = optionalModel.get();
        BeanUtils.copyProperties(modelUpdateDto, model, getNullPropertyNames(modelUpdateDto));

        // 如果设置为默认模型，需要将其他模型的默认标志取消
        if (modelUpdateDto.getIsDefault() != null && modelUpdateDto.getIsDefault()) {
            resetDefaultModel();
        }

        LLMModel updatedModel = modelRepository.save(model);
        return convertToDto(updatedModel);
    }

    @Override
    @Transactional
    public LLMModelDto deleteModel(String modelId) {
        Optional<LLMModel> optionalModel = modelRepository.findById(modelId);
        if (!optionalModel.isPresent()) {
            throw new RuntimeException("模型不存在");
        }

        LLMModel model = optionalModel.get();
        LLMModelDto modelDto = convertToDto(model);

        // 实际可以选择软删除，这里采用硬删除
        modelRepository.delete(model);
        return modelDto;
    }

    @Override
    public LLMModelDto getModelById(String modelId) {
        Optional<LLMModel> optionalModel = modelRepository.findById(modelId);
        if (!optionalModel.isPresent()) {
            throw new RuntimeException("模型不存在");
        }
        return convertToDto(optionalModel.get());
    }

    @Override
    public LLMModelDto getDefaultModel() {
        Optional<LLMModel> optionalModel = modelRepository.findByIsDefault("1");
        if (!optionalModel.isPresent()) {
            throw new RuntimeException("未设置默认模型");
        }
        return convertToDto(optionalModel.get());
    }

    @Override
    public Page<LLMModelDto> searchModels(LLMModelQueryDto queryDto) {
        // TODO
        return null;
    }

    @Override
    public List<LLMModelDto> getActiveModels() {
        List<LLMModel> activeModels = modelRepository.findByStatus(LLMModel.ModelStatus.ACTIVE);
        return activeModels.stream().map(this::convertToDto).toList();
    }

    @Override
    @Transactional
    public void setDefaultModel(String modelId) {
        Optional<LLMModel> optionalModel = modelRepository.findById(modelId);
        if (!optionalModel.isPresent()) {
            throw new RuntimeException("模型不存在");
        }

        LLMModel model = optionalModel.get();
        if (!LLMModel.ModelStatus.ACTIVE.equals(model.getStatus())) {
            throw new RuntimeException("只能将激活状态的模型设为默认模型");
        }

        // 重置所有模型的默认标志
        resetDefaultModel();

        // 设置当前模型为默认
        model.setIsDefault("1");
        modelRepository.save(model);
    }

    /**
     * 重置所有模型的默认标志
     */
    private void resetDefaultModel() {
        List<LLMModel> models = modelRepository.findAll();
        for (LLMModel model : models) {
            model.setIsDefault("0");
            modelRepository.save(model);
        }
    }

    /**
     * 将实体类转换为DTO
     */
    private LLMModelDto convertToDto(LLMModel model) {
        LLMModelDto dto = new LLMModelDto();
        BeanUtils.copyProperties(model, dto);
        // 这里可以根据需要添加额外的转换逻辑，比如获取创建人的中文名等
        return dto;
    }

    /**
     * 获取对象中值为null的属性名数组
     */
    private String[] getNullPropertyNames(Object source) {
        java.beans.BeanInfo beanInfo;
        try {
            beanInfo = java.beans.Introspector.getBeanInfo(source.getClass());
        } catch (java.beans.IntrospectionException e) {
            throw new RuntimeException(e);
        }
        java.beans.PropertyDescriptor[] propertyDescriptors = beanInfo.getPropertyDescriptors();
        List<String> nullPropertyNames = new ArrayList<>();
        for (java.beans.PropertyDescriptor propertyDescriptor : propertyDescriptors) {
            try {
                Object value = propertyDescriptor.getReadMethod().invoke(source);
                if (value == null) {
                    nullPropertyNames.add(propertyDescriptor.getName());
                }
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        }
        // 排除ID字段，避免被覆盖
        nullPropertyNames.add("id");
        return nullPropertyNames.toArray(new String[0]);
    }
}
