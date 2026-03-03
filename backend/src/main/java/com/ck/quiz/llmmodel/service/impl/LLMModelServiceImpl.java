package com.ck.quiz.llmmodel.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.llmmodel.dto.LLMModelCreateDto;
import com.ck.quiz.llmmodel.dto.LLMModelDto;
import com.ck.quiz.llmmodel.dto.LLMModelQueryDto;
import com.ck.quiz.llmmodel.dto.LLMModelUpdateDto;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.tag.entity.Tag;
import com.ck.quiz.tag_obj.entity.TagObjRela;
import com.ck.quiz.utils.JdbcQueryHelper;
import java.util.stream.Collectors;

import org.springframework.ai.document.MetadataMode;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.OpenAiEmbeddingModel;
import org.springframework.ai.openai.OpenAiEmbeddingOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

@Service
public class LLMModelServiceImpl extends
        BaseServiceImpl<LLMModelCreateDto, LLMModelUpdateDto, LLMModelQueryDto, LLMModelDto, LLMModel, LLMModelRepository>
        implements LLMModelService {

    @Override
    protected String getTagType() {
        return "LLM_MODEL";
    }

    @Autowired
    private LLMModelRepository llmModelRepository;

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
                "SELECT DISTINCT m.id, m.name, m.provider, m.type, m.descr, " +
                        "m.api_key, m.api_endpoint, m.context_window, m.input_price_per1k, m.output_price_per1k, " +
                        "m.is_default, m.create_date, m.create_user, m.update_date, m.update_user, m.config, " +
                        "u.user_name AS create_user_name " +
                        "FROM llm_model m " +
                        "LEFT JOIN users u ON u.user_id = m.create_user " +
                        "LEFT JOIN obj_tag_obj_rela tr ON tr.obj_id = m.id " +
                        "LEFT JOIN tag t ON t.id = tr.tag_id ");

        StringBuilder countSql = new StringBuilder("SELECT COUNT(DISTINCT m.id) FROM llm_model m " +
                "LEFT JOIN obj_tag_obj_rela tr ON tr.obj_id = m.id " +
                "LEFT JOIN tag t ON t.id = tr.tag_id ");

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        java.util.Map<String, Object> params = new java.util.HashMap<>();

        if (queryDto.getKeyWord() != null && !queryDto.getKeyWord().isEmpty()) {
            JdbcQueryHelper.lowerLike("nameKey", queryDto.getKeyWord(), " AND LOWER(m.name) LIKE :nameKey ", params,
                    namedParameterJdbcTemplate, sql, countSql);
        }

        if (queryDto.getProvider() != null && !queryDto.getProvider().isEmpty()) {
            JdbcQueryHelper.equals("provider", queryDto.getProvider(), " AND m.provider = :provider ", params, sql,
                    countSql);
        }

        if (queryDto.getType() != null) {
            JdbcQueryHelper.equals("type", queryDto.getType().name(), " AND m.type = :type ", params, sql, countSql);
        }

        if (queryDto.getIsDefault() != null && !queryDto.getIsDefault().isEmpty()) {
            JdbcQueryHelper.equals("isDefault", queryDto.getIsDefault(), " AND m.is_default = :isDefault ", params, sql,
                    countSql);
        }

        // 标签过滤
        if (queryDto.getTags() != null && !queryDto.getTags().isEmpty()) {
            sql.append(" AND t.name IN (:tags) ");
            countSql.append(" AND t.name IN (:tags) ");
            params.put("tags", queryDto.getTags());
        }

        JdbcQueryHelper.order("m.create_date", "desc", sql);

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        List<LLMModelDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            LLMModelDto dto = new LLMModelDto();
            dto.setId(rs.getString("id"));
            dto.setName(rs.getString("name"));
            dto.setProvider(rs.getString("provider"));
            dto.setType(rs.getString("type") != null ? LLMModel.ModelType.valueOf(rs.getString("type")) : null);
            dto.setDescr(rs.getString("descr"));
            dto.setApiKey(rs.getString("api_key"));
            dto.setApiEndpoint(rs.getString("api_endpoint"));
            dto.setContextWindow(rs.getObject("context_window") != null ? rs.getInt("context_window") : null);
            dto.setInputPricePer1k(
                    rs.getObject("input_price_per1k") != null ? rs.getDouble("input_price_per1k") : null);
            dto.setOutputPricePer1k(
                    rs.getObject("output_price_per1k") != null ? rs.getDouble("output_price_per1k") : null);
            dto.setIsDefault(rs.getString("is_default"));
            dto.setConfig(rs.getString("config"));
            dto.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(
                    rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        // 批量加载 Tags
        if (!list.isEmpty())

        {
            List<String> objIds = list.stream().map(LLMModelDto::getId).collect(Collectors.toList());
            List<TagObjRela> tagRelas = tagObjRelaRepository.findByObjIdIn(objIds);
            if (!tagRelas.isEmpty()) {
                java.util.Map<String, List<String>> objToTagIdsMap = tagRelas.stream()
                        .collect(Collectors.groupingBy(TagObjRela::getObjId,
                                Collectors.mapping(TagObjRela::getTagId, Collectors.toList())));
                List<String> allTagIds = tagRelas.stream().map(TagObjRela::getTagId).distinct()
                        .collect(Collectors.toList());
                if (!allTagIds.isEmpty()) {
                    java.util.Map<String, Tag> tagMap = tagRepository.findAllById(allTagIds).stream()
                            .collect(Collectors.toMap(Tag::getId, tag -> tag));
                    list.forEach(dto -> {
                        List<String> tagIds = objToTagIdsMap.get(dto.getId());
                        if (tagIds != null) {
                            List<Tag> tags = tagIds.stream()
                                    .map(tagMap::get)
                                    .filter(tag -> tag != null)
                                    .collect(Collectors.toList());
                            dto.setTagNames(tags.stream().map(Tag::getName).collect(Collectors.toList()));
                            dto.setTagLabels(tags.stream().map(Tag::getLabel).collect(Collectors.toList()));
                        }
                    });
                }
            }
        }

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
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

    @Override
    public OpenAiChatModel getChatModel(String modelName) {
        LLMModel model = resolveModel(modelName);
        if (model == null) {
            throw new RuntimeException("未找到指定的模型，请先在模型管理中配置模型");
        }
        OpenAiApi openAiApi = OpenAiApi.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getApiEndpoint())
                .build();
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(model.getName())
                .build();
        OpenAiChatModel chatModel = OpenAiChatModel.builder()
                .openAiApi(openAiApi)
                .defaultOptions(options)
                .build();
        return chatModel;
    }

    @Override
    public OpenAiEmbeddingModel getEmbeddingModel(String modelName) {
        LLMModel model;
        if (StringUtils.hasText(modelName)) {
            model = llmModelRepository.findByName(modelName).orElse(null);
        } else {
            model = llmModelRepository.findByTypeAndIsDefault(LLMModel.ModelType.EMBEDDING, "1").orElse(null);
        }

        if (model == null) {
            throw new RuntimeException("未找到指定的嵌入模型，请先在模型管理中配置");
        }

        OpenAiApi openAiApi = OpenAiApi.builder()
                .apiKey(model.getApiKey())
                .baseUrl(model.getApiEndpoint())
                .build();

        OpenAiEmbeddingOptions options = OpenAiEmbeddingOptions.builder()
                .model(model.getName())
                .build();

        return new OpenAiEmbeddingModel(openAiApi, MetadataMode.EMBED, options);
    }

    private LLMModel resolveModel(String modelName) {
        if (StringUtils.hasText(modelName)) {
            return llmModelRepository.findByName(modelName).orElse(null);
        } else {
            return llmModelRepository.findByTypeAndIsDefault(LLMModel.ModelType.TEXT, "1").orElse(null);
        }
    }
}
