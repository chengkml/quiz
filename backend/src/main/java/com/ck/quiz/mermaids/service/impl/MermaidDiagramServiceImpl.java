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
import com.ck.quiz.group.entity.Group;
import com.ck.quiz.group.repository.GroupRepository;
import com.ck.quiz.group_obj.entity.GroupObjRela;
import com.ck.quiz.group_obj.repository.GroupObjRelaRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

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

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupObjRelaRepository groupObjRelaRepository;

    @Override
    public MermaidDiagramDTO create(MermaidDiagramDTO dto) {
        MermaidDiagram e = new MermaidDiagram();
        e.setId(dto.getId() == null ? IdHelper.genUuid() : dto.getId());
        e.setDiagramName(dto.getDiagramName());
        e.setDescription(dto.getDescription());
        e.setDiagramData(dto.getDiagramData());
        // e.setCategoryId(dto.getCategoryId()); // Using Group instead
        e = repository.save(e);

        // Handle Group Relation
        handleGroupRelation(e, dto.getGroup());

        return toDto(e);
    }

    private void handleGroupRelation(MermaidDiagram e, String groupName) {
        // Delete existing
        try {
            groupObjRelaRepository.deleteByObjId(e.getId());
        } catch (Exception ex) {
            // ignore if not exists or error? Better to log.
            // Assuming JPA deleteByObjId is transactional
        }

        if (groupName != null && !groupName.isEmpty()) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String createUser = e.getCreateUser();
            if (authentication != null && authentication.isAuthenticated()) {
                // If creating/updating, we might want to use current user or the owner.
                // MindMap uses: repository.findByCreateUserAndName(createUser, groupName)
                // But createUser might be null if prePersist hasn't run yet?
                // Actually e is saved, so e.getCreateUser() should be populated (due to
                // @PrePersist)
                // Wait, @PrePersist runs on save. Yes.
            }
            if (createUser == null && authentication != null) {
                createUser = authentication.getName();
            }

            if (createUser != null) {
                Group group = groupRepository.findByCreateUserAndNameAndType(createUser, groupName, "MERMAID");
                if (group != null) {
                    GroupObjRela rela = new GroupObjRela();
                    rela.setRelaId(IdHelper.genUuid());
                    rela.setGroupId(group.getId());
                    rela.setObjId(e.getId());
                    groupObjRelaRepository.save(rela);
                }
            }
        }
    }

    @Override
    public MermaidDiagramDTO update(String id, MermaidDiagramDTO dto) {
        MermaidDiagram e = repository.findById(id).orElseThrow(() -> new RuntimeException("Diagram not found"));
        if (dto.getDiagramName() != null)
            e.setDiagramName(dto.getDiagramName());
        if (dto.getDescription() != null)
            e.setDescription(dto.getDescription());
        if (dto.getDiagramData() != null)
            e.setDiagramData(dto.getDiagramData());
        // if (dto.getCategoryId() != null) e.setCategoryId(dto.getCategoryId());
        e = repository.save(e);

        // Handle Group
        if (dto.getGroup() != null) { // Only update if passed
            handleGroupRelation(e, dto.getGroup());
        }

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
    public Page<MermaidDiagramDTO> list(String keyword, String group, Pageable pageable) {
        // Join obj_group via obj_group_obj_rela
        StringBuilder sql = new StringBuilder(
                "select d.*, g.name as group_name, g.label as group_label from mermaid_diagram d " +
                        "left join obj_group_obj_rela r on d.diagram_id = r.obj_id " +
                        "left join obj_group g on r.group_id = g.id where 1=1 ");
        StringBuilder countSql = new StringBuilder("select count(1) from mermaid_diagram d " +
                "left join obj_group_obj_rela r on d.diagram_id = r.obj_id " +
                "left join obj_group g on r.group_id = g.id where 1=1 ");
        Map<String, Object> params = new HashMap<>();

        // 名称/关键字模糊匹配
        JdbcQueryHelper.lowerLike("diagramName", keyword, " and lower(d.diagram_name) like :diagramName ", params,
                jdbcTemplate, sql, countSql);

        // 分组过滤
        if (group != null && !group.isEmpty()) {
            JdbcQueryHelper.equals("group", group, " and g.name = :group ", params, sql, countSql);
        }

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

            d.setGroup(rs.getString("group_name"));
            d.setGroupLabel(rs.getString("group_label"));

            java.sql.Timestamp cts = rs.getTimestamp("create_date");
            if (cts != null)
                d.setCreateDate(cts.toLocalDateTime());
            d.setCreateUser(rs.getString("create_user"));
            java.sql.Timestamp uts = rs.getTimestamp("update_date");
            if (uts != null)
                d.setUpdateDate(uts.toLocalDateTime());
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
                    } else {
                        throw new RuntimeException("Template not found");
                    }
                } catch (Exception e) {
                    // 如果获取模板失败，则使用默认的严格提示词
                    String adv = advice == null ? "" : advice;
                    String ddata = diagramData == null ? "" : diagramData;
                    finalPrompt = "You are an expert in Mermaid diagrams.\n" +
                            "Please update or generate the Mermaid code based on the user's advice.\n\n" +
                            "User Advice:\n" + adv + "\n\n" +
                            "Current Mermaid Code:\n" + ddata + "\n\n" +
                            "IMPORTANT RULES:\n" +
                            "1. Return ONLY the raw Mermaid code.\n" +
                            "2. Do NOT wrap the code in markdown code blocks (e.g., do NOT use ```mermaid).\n" +
                            "3. Do NOT include any conversational text or explanations.\n" +
                            "4. The output must be directly renderable by the Mermaid library.";
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

        d.setCreateDate(e.getCreateDate());
        d.setCreateUser(e.getCreateUser());
        d.setUpdateDate(e.getUpdateDate());
        d.setUpdateUser(e.getUpdateUser());
        return d;
    }
}
