package com.ck.quiz.mermaids.service.impl;

import com.ck.quiz.mermaids.dto.MermaidDiagramDTO;
import com.ck.quiz.mermaids.entity.MermaidDiagram;
import com.ck.quiz.mermaids.repository.MermaidDiagramRepository;
import com.ck.quiz.mermaids.service.MermaidDiagramService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;

// removed unused import

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class MermaidDiagramServiceImpl implements MermaidDiagramService {

    private final MermaidDiagramRepository repository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    private LLMModelRepository llmModelRepository;

    @Autowired
    private PromptTemplateService promptTemplateService;

    @Override
    public MermaidDiagramDTO create(MermaidDiagramDTO dto) {
        MermaidDiagram e = new MermaidDiagram();
        e.setId(dto.getId() == null ? IdHelper.genUuid() : dto.getId());
        e.setDiagramName(dto.getDiagramName());
        e.setDescription(dto.getDescription());
        e.setDiagramData(dto.getDiagramData());
        e.setCategoryId(dto.getCategoryId());
        e = repository.save(e);
        return toDto(e);
    }

    @Override
    public MermaidDiagramDTO update(String id, MermaidDiagramDTO dto) {
        MermaidDiagram e = repository.findById(id).orElseThrow(() -> new RuntimeException("Diagram not found"));
        if (dto.getDiagramName() != null) e.setDiagramName(dto.getDiagramName());
        if (dto.getDescription() != null) e.setDescription(dto.getDescription());
        if (dto.getDiagramData() != null) e.setDiagramData(dto.getDiagramData());
        if (dto.getCategoryId() != null) e.setCategoryId(dto.getCategoryId());
        e = repository.save(e);
        return toDto(e);
    }

    @Override
    public MermaidDiagramDTO updateDiagramData(String id, String diagramData) {
        MermaidDiagram e = repository.findById(id).orElseThrow(() -> new RuntimeException("Diagram not found"));
        e.setDiagramData(diagramData);
        e = repository.save(e);
        return toDto(e);
    }

    @Override
    public void delete(String id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public MermaidDiagramDTO findById(String id) {
        return repository.findById(id).map(this::toDto).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MermaidDiagramDTO> list(String keyword, String categoryId, Pageable pageable) {
        StringBuilder sql = new StringBuilder("select d.*, c.category_name from mermaid_diagram d left join mermaid_category c on d.category_id = c.category_id where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from mermaid_diagram d where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 名称/关键字模糊匹配
        JdbcQueryHelper.lowerLike("diagramName", keyword, " and lower(d.diagram_name) like :diagramName ", params, jdbcTemplate, sql, countSql);

        // 分类过滤
        JdbcQueryHelper.equals("categoryId", categoryId, " and d.category_id = :categoryId ", params, sql, countSql);

        // 默认按更新时间降序
        JdbcQueryHelper.order("d.update_date", "desc", sql);

        int pageNum = pageable.getPageNumber();
        int pageSize = pageable.getPageSize();

        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), pageNum, pageSize);

        List<MermaidDiagramDTO> dtos = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            MermaidDiagramDTO d = new MermaidDiagramDTO();
            d.setId(rs.getString("diagram_id"));
            d.setDiagramName(rs.getString("diagram_name"));
            d.setDescription(rs.getString("description"));
            d.setDiagramData(rs.getString("diagram_data"));
            d.setCategoryId(rs.getString("category_id"));
            // 从查询结果中获取 categoryName（通过 left join 查询得到）
            d.setCategoryName(rs.getString("category_name"));
            java.sql.Timestamp cts = rs.getTimestamp("create_date");
            if (cts != null) d.setCreateDate(cts.toLocalDateTime());
            d.setCreateUser(rs.getString("create_user"));
            java.sql.Timestamp uts = rs.getTimestamp("update_date");
            if (uts != null) d.setUpdateDate(uts.toLocalDateTime());
            d.setUpdateUser(rs.getString("update_user"));
            return d;
        });

        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, dtos, pageNum, pageSize);
    }

    @Override
    public SseEmitter streamGenerateDiagram(String advice, String diagramData, String modelName) {
        SseEmitter emitter = new SseEmitter(0L);
        new Thread(() -> {
            try {
                LLMModel model = resolveModel(modelName);
                if (model == null) {
                    try {
                        emitter.send("[ERROR]未找到指定的文本模型，请先在模型管理中配置模型");
                    } catch (Exception ex) {
                        // ignore
                    }
                    emitter.completeWithError(new RuntimeException("未找到指定的文本模型，请先在模型管理中配置模型"));
                    return;
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
                ChatClient chat = ChatClient.builder(chatModel).build();

                String finalPrompt = advice;
                try {
                    PromptTemplateDto tpl = promptTemplateService.getByName("mermaidGenerate");
                    if (tpl != null && tpl.getContent() != null && !tpl.getContent().isEmpty()) {
                        String content = tpl.getContent();
                        String adv = advice == null ? "" : advice;
                        String ddata = diagramData == null ? "" : diagramData;
                        finalPrompt = content.replace("{{advice}}", adv).replace("{{diagramData}}", ddata);
                    }
                } catch (Exception e) {
                    // 如果获取模板失败，则使用传入的 advice 与 diagramData 组合
                    if (advice == null) {
                        finalPrompt = (diagramData == null ? "" : diagramData);
                    } else {
                        finalPrompt = advice + "\n\n" + (diagramData == null ? "" : diagramData);
                    }
                }

                // 直接使用构建好的 finalPrompt 进行流式调用并将 chunk 逐个推送到前端
                chat.prompt().user(finalPrompt).stream().content().doOnNext(chunk -> {
                    try {
                        emitter.send(chunk);
                    } catch (Exception e) {
                        // ignore send errors
                    }
                }).blockLast();

                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send("[ERROR]服务异常: " + e.getMessage());
                } catch (Exception ex) {
                    // ignore
                }
                try {
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                    // ignore
                }
            }
        }).start();
        return emitter;
    }

    private LLMModel resolveModel(String modelName) {
        if (modelName != null && !modelName.isEmpty()) {
            return llmModelRepository.findByName(modelName).orElse(null);
        } else {
            return llmModelRepository.findByTypeAndIsDefault(LLMModel.ModelType.TEXT, "1").orElse(null);
        }
    }

    private MermaidDiagramDTO toDto(MermaidDiagram e) {
        MermaidDiagramDTO d = new MermaidDiagramDTO();
        d.setId(e.getId());
        d.setDiagramName(e.getDiagramName());
        d.setDescription(e.getDescription());
        d.setDiagramData(e.getDiagramData());
        d.setCategoryId(e.getCategoryId());
        d.setCreateDate(e.getCreateDate());
        d.setCreateUser(e.getCreateUser());
        d.setUpdateDate(e.getUpdateDate());
        d.setUpdateUser(e.getUpdateUser());
        return d;
    }
}
