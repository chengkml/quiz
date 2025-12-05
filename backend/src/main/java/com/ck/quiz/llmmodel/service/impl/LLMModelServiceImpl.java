package com.ck.quiz.llmmodel.service.impl;

import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;

import io.micrometer.common.lang.NonNull;

import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * 大语言模型管理服务实现类
 */
@Service
public class LLMModelServiceImpl implements LLMModelService {

    @Autowired
    private LLMModelRepository modelRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

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
        model.setId(IdHelper.genUuid());
        model.setIsDefault("0");

        LLMModel savedModel = modelRepository.save(model);
        return convertToDto(savedModel);
    }

    @Override
    @Transactional
    public LLMModelDto updateModel(@NonNull LLMModelUpdateDto modelUpdateDto) {
        Optional<LLMModel> optionalModel = modelRepository.findById(modelUpdateDto.getId());
        if (!optionalModel.isPresent()) {
            throw new RuntimeException("模型不存在");
        }

        LLMModel model = optionalModel.get();
        BeanUtils.copyProperties(modelUpdateDto, model, getNullPropertyNames(modelUpdateDto));

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
    @Transactional(readOnly = true)
    public Page<LLMModelDto> searchModels(LLMModelQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT m.model_id AS id, m.name, m.provider, m.type, m.description, " +
                        "m.api_key, m.api_endpoint, m.context_window, m.input_price_per_1k, m.output_price_per_1k, " +
                        "m.is_default, m.create_date, m.create_user, m.update_date, m.update_user, " +
                        "u.user_name AS create_user_name " +
                        "FROM llm_model m LEFT JOIN user u ON u.user_id = m.create_user "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM llm_model m "
        );

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        java.util.Map<String, Object> params = new java.util.HashMap<>();

        // 动态条件
        JdbcQueryHelper.lowerLike("nameKey", queryDto.getName(), " AND LOWER(m.name) LIKE :nameKey ", params, jdbcTemplate, sql, countSql);

        if (queryDto.getProvider() != null && !queryDto.getProvider().isEmpty()) {
            JdbcQueryHelper.equals("provider", queryDto.getProvider(), " AND m.provider = :provider ", params, sql, countSql);
        }

        if (queryDto.getType() != null) {
            JdbcQueryHelper.equals("type", queryDto.getType().name(), " AND m.type = :type ", params, sql, countSql);
        }

        if (queryDto.getIsDefault() != null && !queryDto.getIsDefault().isEmpty()) {
            JdbcQueryHelper.equals("isDefault", queryDto.getIsDefault(), " AND m.is_default = :isDefault ", params, sql, countSql);
        }

        // 排序
        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        java.util.List<LLMModelDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            LLMModelDto dto = new LLMModelDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setProvider(rs.getString("provider"));
            dto.setType(rs.getString("type") != null ? LLMModel.ModelType.valueOf(rs.getString("type")) : null);
            dto.setDescription(rs.getString("description"));
            dto.setApiEndpoint(rs.getString("api_endpoint"));
            dto.setContextWindow(rs.getObject("context_window") != null ? rs.getInt("context_window") : null);
            dto.setInputPricePer1k(rs.getObject("input_price_per_1k") != null ? rs.getDouble("input_price_per_1k") : null);
            dto.setOutputPricePer1k(rs.getObject("output_price_per_1k") != null ? rs.getDouble("output_price_per_1k") : null);
            dto.setIsDefault(rs.getString("is_default"));
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    @Transactional
    public void setDefaultModel(String modelId) {
        Optional<LLMModel> optionalModel = modelRepository.findById(modelId);
        if (!optionalModel.isPresent()) {
            throw new RuntimeException("模型不存在");
        }

        LLMModel model = optionalModel.get();

        // 重置所有模型的默认标志
        // 仅重置与当前模型相同类型的默认标志
        resetDefaultModel(model.getType());

        // 设置当前模型为默认
        model.setIsDefault("1");
        modelRepository.save(model);
    }

    /**
     * 重置所有模型的默认标志
     */
    /**
     * 重置指定类型模型的默认标志
     */
    private void resetDefaultModel(LLMModel.ModelType type) {
        List<LLMModel> models = modelRepository.findAll();
        for (LLMModel model : models) {
            if (model.getType() == type) {
                model.setIsDefault("0");
                modelRepository.save(model);
            }
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
