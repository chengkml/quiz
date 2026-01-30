package com.ck.quiz.mermaids.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.group.entity.Group;
import com.ck.quiz.group.repository.GroupRepository;
import com.ck.quiz.group_obj.entity.GroupObjRela;
import com.ck.quiz.group_obj.repository.GroupObjRelaRepository;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
import com.ck.quiz.mermaids.dto.MermaidDiagramCreateDto;
import com.ck.quiz.mermaids.dto.MermaidDiagramDto;
import com.ck.quiz.mermaids.dto.MermaidDiagramQueryDto;
import com.ck.quiz.mermaids.dto.MermaidDiagramUpdateDto;
import com.ck.quiz.mermaids.entity.MermaidDiagram;
import com.ck.quiz.mermaids.repository.MermaidDiagramRepository;
import com.ck.quiz.mermaids.service.MermaidDiagramService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class MermaidDiagramServiceImpl
        extends
        BaseServiceImpl<MermaidDiagramCreateDto, MermaidDiagramUpdateDto, MermaidDiagramQueryDto, MermaidDiagramDto, MermaidDiagram, MermaidDiagramRepository>
        implements MermaidDiagramService {

    @Autowired
    private LLMModelRepository llmModelRepository;

    @Autowired
    private PromptTemplateService promptTemplateService;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupObjRelaRepository groupObjRelaRepository;

    @Autowired
    private com.ck.quiz.knowledgeset.service.VectorService vectorService;

    @Autowired
    private com.ck.quiz.knowledgeset.repository.KnowledgeSetRepository knowledgeSetRepository;

    @Autowired
    private com.ck.quiz.knowledgeset.repository.KnowledgeSourceRepository knowledgeSourceRepository;

    @Override
    public Page<MermaidDiagramDto> search(String userId, MermaidDiagramQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "select d.*, g.name as group_name, g.label as group_label from mermaid_diagram d " +
                        "left join obj_group_obj_rela r on d.id = r.obj_id " +
                        "left join obj_group g on r.group_id = g.id where 1=1 ");

        StringBuilder countSql = new StringBuilder("select count(1) from mermaid_diagram d " +
                "left join obj_group_obj_rela r on d.id = r.obj_id " +
                "left join obj_group g on r.group_id = g.id where 1=1 ");

        Map<String, Object> params = new HashMap<>();

        // 名称/关键字模糊匹配
        JdbcQueryHelper.lowerLike("diagramName", queryDto.getKeyWord(),
                " and lower(d.diagram_name) like :diagramName ", params,
                namedParameterJdbcTemplate, sql, countSql);

        // 分组过滤
        if (queryDto.getGroup() != null && !queryDto.getGroup().isEmpty()) {
            JdbcQueryHelper.equals("group", queryDto.getGroup(), " and g.name = :group ", params, sql, countSql);
        }

        // 默认按更新时间降序
        JdbcQueryHelper.order("d.update_date", "desc", sql);

        int pageNum = queryDto.getPageNum();
        int pageSize = queryDto.getPageSize();

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), pageNum, pageSize);

        List<MermaidDiagramDto> dtos = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            // Manually fill Dto as BaseServiceImpl expects DTO
            MermaidDiagramDto dto = new MermaidDiagramDto();
            dto.setId(rs.getString("id"));
            dto.setDiagramName(rs.getString("diagram_name"));
            dto.setDescription(rs.getString("description"));
            dto.setDiagramData(rs.getString("diagram_data"));

            dto.setGroupName(rs.getString("group_name"));
            dto.setGroupLabel(rs.getString("group_label"));

            java.sql.Timestamp cts = rs.getTimestamp("create_date");
            if (cts != null)
                dto.setCreateDate(cts.toLocalDateTime());
            dto.setCreateUser(rs.getString("create_user"));
            java.sql.Timestamp uts = rs.getTimestamp("update_date");
            if (uts != null)
                dto.setUpdateDate(uts.toLocalDateTime());
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, dtos, pageNum, pageSize);
    }

    @Override
    protected MermaidDiagramDto newDto() {
        return new MermaidDiagramDto();
    }

    @Override
    protected MermaidDiagram newModel() {
        return new MermaidDiagram();
    }

    @Override
    public MermaidDiagramDto create(MermaidDiagramCreateDto createDto) {
        // 保存原始分组值
        String originalGroup = createDto.getGroup();
        // 临时设为 null，避免 BaseServiceImpl 使用错误的查询方法
        createDto.setGroup(null);

        // 调用父类方法创建实体
        MermaidDiagramDto dto = super.create(createDto);

        // 手动处理分组关系（使用带 type 的查询）
        if (originalGroup != null && !originalGroup.isEmpty()) {
            MermaidDiagram e = repository.findById(dto.getId()).orElse(null);
            if (e != null) {
                handleGroupRelation(e, originalGroup);
                dto.setGroupName(originalGroup);
            }
        }

        // 同步到向量库
        try {
            syncToVectorStore(repository.findById(dto.getId()).orElse(null));
        } catch (Exception e) {
            e.printStackTrace();
        }

        return dto;
    }

    @Override
    public MermaidDiagramDto update(String id, MermaidDiagramUpdateDto updateDto) {
        // 保存原始分组值
        String originalGroup = updateDto.getGroup();
        // 临时设为 null，避免 BaseServiceImpl 使用错误的查询方法
        updateDto.setGroup(null);

        // 调用父类方法更新实体
        MermaidDiagramDto dto = super.update(id, updateDto);

        // 手动处理分组关系（使用带 type 的查询）
        if (originalGroup != null) {
            MermaidDiagram e = repository.findById(id).orElse(null);
            if (e != null) {
                handleGroupRelation(e, originalGroup);
                dto.setGroupName(originalGroup);
            }
        }

        // 同步到向量库
        try {
            syncToVectorStore(repository.findById(dto.getId()).orElse(null));
        } catch (Exception e) {
            e.printStackTrace();
        }

        return dto;
    }

    private void handleGroupRelation(MermaidDiagram e, String groupName) {
        // Delete existing
        try {
            groupObjRelaRepository.deleteByObjId(e.getId());
        } catch (Exception ex) {
            // ignore
        }

        if (groupName != null && !groupName.isEmpty()) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String createUser = e.getCreateUser();
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
    public MermaidDiagramDto updateDiagramData(String id, String diagramData) {
        MermaidDiagram e = repository.findById(id).orElseThrow(() -> new RuntimeException("Diagram not found"));
        e.setDiagramData(diagramData);
        e = repository.save(e);

        // 同步到向量库
        try {
            syncToVectorStore(e);
        } catch (Exception ex) {
            ex.printStackTrace();
        }

        return convertToDto(e, true);
    }

    private void syncToVectorStore(MermaidDiagram diagram) {
        if (diagram == null)
            return;

        // 1. 查找用户的"流程图"知识集
        String userId = diagram.getCreateUser();
        if (userId == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null)
                userId = auth.getName();
        }
        if (userId == null)
            return;

        com.ck.quiz.knowledgeset.entity.KnowledgeSet knowledgeSet = knowledgeSetRepository
                .findByNameAndCreateUser("流程图", userId);

        if (knowledgeSet == null)
            return;

        // 2. 查找或创建 KnowledgeSource (使用 diagramId 作为 sourceId)
        com.ck.quiz.knowledgeset.entity.KnowledgeSource source = knowledgeSourceRepository.findById(diagram.getId())
                .orElse(null);

        if (source == null) {
            source = new com.ck.quiz.knowledgeset.entity.KnowledgeSource();
            source.setId(diagram.getId()); // Reuse ID
            source.setCreateUser(userId);
            source.setCreateDate(LocalDateTime.now());
        }

        source.setKnowledgeSetId(knowledgeSet.getId());
        source.setName(diagram.getDiagramName() != null ? diagram.getDiagramName() : "未命名流程图");
        source.setType("MERMAID"); // New type
        source.setStatus("SUCCESS");
        source.setDescr(diagram.getDescription());
        source.setUpdateUser(userId);
        source.setUpdateDate(LocalDateTime.now());

        knowledgeSourceRepository.save(source);

        // 3. 删除旧向量
        vectorService.deleteBySourceId(source.getId());

        // 4. 创建新 KnowledgeChunk
        // 如果内容为空，则不创建切片，相当于清空
        if (diagram.getDiagramData() == null || diagram.getDiagramData().isEmpty()) {
            return;
        }

        com.ck.quiz.knowledgeset.entity.KnowledgeChunk chunk = new com.ck.quiz.knowledgeset.entity.KnowledgeChunk();
        chunk.setId(IdHelper.genUuid());
        chunk.setKnowledgeSourceId(source.getId());
        chunk.setChunkIndex(0);

        StringBuilder content = new StringBuilder();
        content.append("流程图名称: ").append(source.getName()).append("\n");
        if (source.getDescr() != null && !source.getDescr().isEmpty()) {
            content.append("描述: ").append(source.getDescr()).append("\n");
        }
        content.append("Mermaid代码:\n").append(diagram.getDiagramData());

        chunk.setContent(content.toString());
        chunk.setTokenCount(content.length()); // 粗略估算
        chunk.setCreateUser(userId);
        chunk.setUpdateUser(userId);
        chunk.setCreateDate(LocalDateTime.now());
        chunk.setUpdateDate(LocalDateTime.now());

        // 5. 嵌入并保存
        // 查找嵌入模型，默认 OpenAI 或系统默认
        // 这里暂时传 null 让 vectorService 使用默认配置
        vectorService.embedAndStore(java.util.Collections.singletonList(chunk), null);
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
                    }
                    emitter.completeWithError(new RuntimeException("未找到指定的文本模型"));
                    return;
                }

                OpenAiApi openAiApi = OpenAiApi.builder().apiKey(model.getApiKey()).baseUrl(model.getApiEndpoint())
                        .build();
                OpenAiChatOptions options = OpenAiChatOptions.builder().model(model.getName()).build();
                OpenAiChatModel chatModel = OpenAiChatModel.builder().openAiApi(openAiApi).defaultOptions(options)
                        .build();
                ChatClient chat = ChatClient.builder(chatModel).build();

                String finalPrompt = advice;
                try {
                    PromptTemplateDto tpl = promptTemplateService.getByName("mermaidGenerate");
                    if (tpl != null && tpl.getContent() != null && !tpl.getContent().isEmpty()) {
                        finalPrompt = tpl.getContent().replace("{{advice}}", advice == null ? "" : advice)
                                .replace("{{diagramData}}", diagramData == null ? "" : diagramData);
                    } else {
                        throw new RuntimeException("Template not found");
                    }
                } catch (Exception e) {
                    finalPrompt = "You are an expert in Mermaid diagrams.\n" +
                            "Please update or generate the Mermaid code based on the user's advice.\n\n" +
                            "User Advice:\n" + (advice == null ? "" : advice) + "\n\n" +
                            "Current Mermaid Code:\n" + (diagramData == null ? "" : diagramData) + "\n\n" +
                            "IMPORTANT RULES:\n" +
                            "1. Return ONLY the raw Mermaid code.\n" +
                            "2. Do NOT wrap the code in markdown code blocks.\n" +
                            "3. Do NOT include any conversational text.";
                }

                chat.prompt().user(finalPrompt).stream().content().doOnNext(chunk -> {
                    try {
                        emitter.send(chunk);
                    } catch (Exception e) {
                    }
                }).blockLast();

                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send("[ERROR]服务异常: " + e.getMessage());
                } catch (Exception ex) {
                }
                try {
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                }
            }
        }).start();
        return emitter;
    }

    @Override
    public SseEmitter streamChat(com.ck.quiz.mermaids.dto.MermaidChatRequest request) {
        SseEmitter emitter = new SseEmitter(0L);
        new Thread(() -> {
            try {
                LLMModel model = resolveModel(request.getModelName());
                if (model == null) {
                    try {
                        emitter.send("[ERROR]未找到指定的文本模型，请先在模型管理中配置模型");
                    } catch (Exception ex) {
                    }
                    emitter.completeWithError(new RuntimeException("未找到指定的文本模型"));
                    return;
                }

                OpenAiApi openAiApi = OpenAiApi.builder().apiKey(model.getApiKey()).baseUrl(model.getApiEndpoint())
                        .build();
                OpenAiChatOptions options = OpenAiChatOptions.builder().model(model.getName()).build();
                OpenAiChatModel chatModel = OpenAiChatModel.builder().openAiApi(openAiApi).defaultOptions(options)
                        .build();
                ChatClient chat = ChatClient.builder(chatModel).build();

                List<org.springframework.ai.chat.messages.Message> messages = new java.util.ArrayList<>();

                // System Prompt
                String systemPrompt = "You are an expert in Mermaid diagrams.\n" +
                        "Current Mermaid Code:\n" + (request.getDiagramData() == null ? "" : request.getDiagramData())
                        + "\n\n" +
                        "IMPORTANT RULES:\n" +
                        "1. Return ONLY the raw Mermaid code.\n" +
                        "2. Do NOT wrap the code in markdown code blocks.\n" +
                        "3. Do NOT include any conversational text.";

                // History
                if (request.getMessages() != null) {
                    for (com.ck.quiz.mermaids.dto.MermaidChatRequest.Message msg : request.getMessages()) {
                        if ("user".equalsIgnoreCase(msg.getRole())) {
                            messages.add(new org.springframework.ai.chat.messages.UserMessage(msg.getContent()));
                        } else if ("assistant".equalsIgnoreCase(msg.getRole())) {
                            messages.add(new org.springframework.ai.chat.messages.AssistantMessage(msg.getContent()));
                        }
                    }
                }

                // Add System Message at the beginning
                messages.add(0, new org.springframework.ai.chat.messages.SystemMessage(systemPrompt));

                chat.prompt().messages(messages).stream().content().doOnNext(chunk -> {
                    try {
                        emitter.send(chunk);
                    } catch (Exception e) {
                    }
                }).blockLast();

                emitter.complete();
            } catch (Exception e) {
                try {
                    emitter.send("[ERROR]服务异常: " + e.getMessage());
                } catch (Exception ex) {
                }
                try {
                    emitter.completeWithError(e);
                } catch (Exception ex) {
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
}
