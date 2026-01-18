package com.ck.quiz.llmmodel.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class LLMModelServiceImpl extends BaseServiceImpl<LLMModelCreateDto, LLMModelUpdateDto, LLMModelQueryDto, LLMModelDto, LLMModel, LLMModelRepository> implements LLMModelService {

    @Override
    protected LLMModelDto newDto() {
        return new LLMModelDto();
    }

    @Override
    protected LLMModel newModel() {
        return new LLMModel();
    }

    @Override
    public Page<LLMModelDto> search(String userId, LLMModelQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT m.id, m.name, m.provider, m.type, m.description, " +
                        "m.api_key, m.api_endpoint, m.context_window, m.input_price_per_1k, m.output_price_per_1k, " +
                        "m.is_default, m.create_date, m.create_user, m.update_date, m.update_user, " +
                        "u.user_name AS create_user_name " +
                        "FROM llm_model m LEFT JOIN users u ON u.user_id = m.create_user "
        );

        StringBuilder countSql = new StringBuilder("SELECT COUNT(1) FROM llm_model m ");

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        java.util.Map<String, Object> params = new java.util.HashMap<>();

        if (queryDto.getKeyWord() != null && !queryDto.getKeyWord().isEmpty()) {
            JdbcQueryHelper.lowerLike("nameKey", queryDto.getKeyWord(), " AND LOWER(m.name) LIKE :nameKey ", params, namedParameterJdbcTemplate, sql, countSql);
        }

        if (queryDto.getProvider() != null && !queryDto.getProvider().isEmpty()) {
            JdbcQueryHelper.equals("provider", queryDto.getProvider(), " AND m.provider = :provider ", params, sql, countSql);
        }

        if (queryDto.getType() != null) {
            JdbcQueryHelper.equals("type", queryDto.getType().name(), " AND m.type = :type ", params, sql, countSql);
        }

        if (queryDto.getIsDefault() != null && !queryDto.getIsDefault().isEmpty()) {
            JdbcQueryHelper.equals("isDefault", queryDto.getIsDefault(), " AND m.is_default = :isDefault ", params, sql, countSql);
        }

        JdbcQueryHelper.order("create_date", "desc", sql);

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<LLMModelDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            LLMModelDto dto = new LLMModelDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setProvider(rs.getString("provider"));
            dto.setType(rs.getString("type") != null ? LLMModel.ModelType.valueOf(rs.getString("type")) : null);
            dto.setDescr(rs.getString("descr"));
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

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public List<LLMModelDto> listModelsByType(LLMModel.ModelType modelType) {
        List<LLMModel> models = repository.findByType(modelType);
        if (models == null || models.isEmpty()) {
            return new ArrayList<>();
        }
        return convertToDtos(models);
    }

    @Override
    public void setDefaultModel(String modelId) {
        LLMModel model = repository.findById(modelId).orElseThrow(() -> new RuntimeException("模型不存在"));
        resetDefaultModel(model.getType());
        model.setIsDefault("1");
        repository.save(model);
    }

    private void resetDefaultModel(LLMModel.ModelType type) {
        List<LLMModel> models = repository.findAll();
        for (LLMModel model : models) {
            if (model.getType() == type) {
                model.setIsDefault("0");
                repository.save(model);
            }
        }
    }
}
