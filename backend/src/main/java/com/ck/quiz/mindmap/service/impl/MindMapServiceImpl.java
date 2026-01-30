package com.ck.quiz.mindmap.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.group.dto.GroupDto;
import com.ck.quiz.group.dto.GroupQueryDto;
import com.ck.quiz.group.entity.Group;
import com.ck.quiz.group.repository.GroupRepository;
import com.ck.quiz.group_obj.entity.GroupObjRela;
import com.ck.quiz.group_obj.repository.GroupObjRelaRepository;
import com.ck.quiz.mindmap.dto.*;
import com.ck.quiz.mindmap.entity.MindMap;
import com.ck.quiz.mindmap.repository.MindMapRepository;
import com.ck.quiz.mindmap.service.MindMapService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 思维导图管理服务实现类
 */
@Slf4j
@Service
@Transactional
public class MindMapServiceImpl extends
        BaseServiceImpl<MindMapCreateDto, MindMapUpdateDto, MindMapQueryDto, MindMapDto, MindMap, MindMapRepository>
        implements MindMapService {

    @Autowired
    private MindMapRepository mindMapRepository;

    @Autowired
    private GroupRepository groupRepository;

    @Autowired
    private GroupObjRelaRepository groupObjRelaRepository;

    @Autowired
    private PromptTemplateService promptTemplateService;

    @Autowired
    private com.ck.quiz.llmmodel.service.LLMModelService llmModelService;

    @Autowired
    private com.ck.quiz.knowledgeset.service.VectorService vectorService;

    @Autowired
    private com.ck.quiz.knowledgeset.repository.KnowledgeSetRepository knowledgeSetRepository;

    @Autowired
    private com.ck.quiz.knowledgeset.repository.KnowledgeSourceRepository knowledgeSourceRepository;

    @Override
    @Transactional
    public MindMapDto updateMindMapBasicInfo(MindMapBasicInfoUpdateDto mindMapBasicInfoUpdateDto) {
        Optional<MindMap> optionalMindMap = mindMapRepository.findById(mindMapBasicInfoUpdateDto.getId());
        if (!optionalMindMap.isPresent()) {
            throw new RuntimeException("思维导图不存在");
        }

        MindMap mindMap = optionalMindMap.get();
        mindMap.setMapName(mindMapBasicInfoUpdateDto.getMapName());
        mindMap.setDescr(mindMapBasicInfoUpdateDto.getDescr());

        // 设置更新人信息
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            mindMap.setUpdateUser(authentication.getName());
        }

        mindMap.setUpdateDate(LocalDateTime.now());

        MindMap updatedMindMap = mindMapRepository.save(mindMap);

        if (mindMapBasicInfoUpdateDto.getGroup() != null) {
            // 删除现有的分组关联
            groupObjRelaRepository.deleteByObjId(updatedMindMap.getId());

            if (org.springframework.util.StringUtils.hasText(mindMapBasicInfoUpdateDto.getGroup())) {
                // 添加新的分组关联
                String createUser = updatedMindMap.getCreateUser();
                Group group = groupRepository.findByCreateUserAndNameAndType(createUser,
                        mindMapBasicInfoUpdateDto.getGroup(), "MIND_MAP");
                if (group != null) {
                    GroupObjRela rela = new GroupObjRela();
                    rela.setRelaId(IdHelper.genUuid());
                    rela.setGroupId(group.getId());
                    rela.setObjId(updatedMindMap.getId());
                    groupObjRelaRepository.save(rela);
                } else {
                    throw new RuntimeException("Group not found: " + mindMapBasicInfoUpdateDto.getGroup());
                }
            }
        }

        // 同步到向量库
        try {
            syncToVectorStore(updatedMindMap);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return convertToDto(updatedMindMap, true);
    }

    @Override
    @Transactional
    public MindMapDto updateMindMapData(MindMapDataUpdateDto mindMapDataUpdateDto) {
        Optional<MindMap> optionalMindMap = mindMapRepository.findById(mindMapDataUpdateDto.getId());
        if (!optionalMindMap.isPresent()) {
            throw new RuntimeException("思维导图不存在");
        }

        MindMap mindMap = optionalMindMap.get();
        mindMap.setMapData(mindMapDataUpdateDto.getMapData());

        // 设置更新人信息
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            mindMap.setUpdateUser(authentication.getName());
        }

        mindMap.setUpdateDate(LocalDateTime.now());

        MindMap updatedMindMap = mindMapRepository.save(mindMap);

        // 同步到向量库
        try {
            syncToVectorStore(updatedMindMap);
        } catch (Exception e) {
            e.printStackTrace();
        }

        return convertToDto(updatedMindMap, true);
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        // 1. 删除向量数据
        try {
            vectorService.deleteBySourceId(id);
        } catch (Exception e) {
            log.error("Failed to delete vector data for mindmap: {}", id, e);
        }

        // 2. 删除知识来源关联
        try {
            knowledgeSourceRepository.deleteById(id);
        } catch (Exception e) {
            log.error("Failed to delete knowledge source for mindmap: {}", id, e);
        }

        // 3. 调用父类方法删除实体及关联
        super.delete(userId, id);
    }

    private void syncToVectorStore(MindMap mindMap) {
        if (mindMap == null)
            return;

        // 1. 查找用户的"思维导图"知识集
        String userId = mindMap.getCreateUser();
        if (userId == null) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null)
                userId = auth.getName();
        }
        if (userId == null)
            return;

        com.ck.quiz.knowledgeset.entity.KnowledgeSet knowledgeSet = knowledgeSetRepository
                .findByNameAndCreateUser("思维导图", userId);

        if (knowledgeSet == null)
            return;

        // 2. 查找或创建 KnowledgeSource (使用 MindMap ID 作为 sourceId)
        com.ck.quiz.knowledgeset.entity.KnowledgeSource source = knowledgeSourceRepository.findById(mindMap.getId())
                .orElse(null);

        if (source == null) {
            source = new com.ck.quiz.knowledgeset.entity.KnowledgeSource();
            source.setId(mindMap.getId()); // Reuse ID
            source.setCreateUser(userId);
            source.setCreateDate(LocalDateTime.now());
        }

        source.setKnowledgeSetId(knowledgeSet.getId());
        source.setName(mindMap.getMapName() != null ? mindMap.getMapName() : "未命名思维导图");
        source.setType("MIND_MAP"); // New type
        source.setStatus("SUCCESS");
        source.setDescr(mindMap.getDescr());
        source.setUpdateUser(userId);
        source.setUpdateDate(LocalDateTime.now());

        knowledgeSourceRepository.save(source);

        // 3. 删除旧向量
        vectorService.deleteBySourceId(source.getId());

        // 4. 创建新 KnowledgeChunk
        // 如果内容为空，则不创建切片
        if (mindMap.getMapData() == null || mindMap.getMapData().isEmpty()) {
            return;
        }

        // 简单处理：将整个 JSON 数据作为切片内容
        // 优化方案：提取 JSON 中的文本内容（节点名称等），去除结构噪音
        String contentText = extractTextFromMindMapJson(mindMap.getMapData());
        if (contentText.isEmpty()) {
            contentText = mindMap.getMapData(); // Fallback to raw JSON if extraction fails or empty
        }

        com.ck.quiz.knowledgeset.entity.KnowledgeChunk chunk = new com.ck.quiz.knowledgeset.entity.KnowledgeChunk();
        chunk.setId(IdHelper.genUuid());
        chunk.setKnowledgeSourceId(source.getId());
        chunk.setChunkIndex(0);

        StringBuilder contentInfo = new StringBuilder();
        contentInfo.append("思维导图名称: ").append(source.getName()).append("\n");
        if (source.getDescr() != null && !source.getDescr().isEmpty()) {
            contentInfo.append("描述: ").append(source.getDescr()).append("\n");
        }
        contentInfo.append("内容:\n").append(contentText);

        chunk.setContent(contentInfo.toString());
        chunk.setTokenCount(contentInfo.length());
        chunk.setCreateUser(userId);
        chunk.setUpdateUser(userId);
        chunk.setCreateDate(LocalDateTime.now());
        chunk.setUpdateDate(LocalDateTime.now());

        // 5. 嵌入并保存
        vectorService.embedAndStore(java.util.Collections.singletonList(chunk), null);
    }

    private String extractTextFromMindMapJson(String json) {
        try {
            ObjectMapper om = new ObjectMapper();
            com.fasterxml.jackson.databind.JsonNode root = om.readTree(json);
            StringBuilder sb = new StringBuilder();
            extractNodeText(root.get("root"), sb, 0);
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    private void extractNodeText(com.fasterxml.jackson.databind.JsonNode node, StringBuilder sb, int depth) {
        if (node == null)
            return;

        // 缩进表示层级
        for (int i = 0; i < depth; i++)
            sb.append("  ");

        if (node.has("data") && node.get("data").has("text")) {
            sb.append(node.get("data").get("text").asText()).append("\n");
        }

        if (node.has("children")) {
            for (com.fasterxml.jackson.databind.JsonNode child : node.get("children")) {
                extractNodeText(child, sb, depth + 1);
            }
        }
    }

    @Override
    public Page<MindMapDto> search(String userId, MindMapQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT m.id, m.map_name, m.descr, m.map_data, " +
                        "m.create_date, m.create_user, u.user_name create_user_name, m.update_date, m.update_user, " +
                        "g.name as group_name, g.label as group_label " +
                        "FROM mind_map m " +
                        "left join users u on u.user_id = m.create_user " +
                        "left join obj_group_obj_rela r ON r.obj_id = m.id " +
                        "left join obj_group g ON g.id = r.group_id ");

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM mind_map m " +
                        "left join obj_group_obj_rela r ON r.obj_id = m.id " +
                        "left join obj_group g ON g.id = r.group_id ");

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        sql.append("WHERE m.create_user = :createUser ");
        countSql.append("WHERE m.create_user = :createUser ");

        Map<String, Object> params = new HashMap<>();
        params.put("createUser", authentication.getName());

        // 查询条件
        if (queryDto.getMapName() != null && !queryDto.getMapName().isEmpty()) {
            sql.append(" AND LOWER(m.map_name) LIKE :mapName ");
            countSql.append(" AND LOWER(m.map_name) LIKE :mapName ");
            params.put("mapName", "%" + queryDto.getMapName().toLowerCase() + "%");
        }

        // 分组过滤
        if (queryDto.getGroups() != null && !queryDto.getGroups().isEmpty()) {
            sql.append(" AND g.name IN (:groups) ");
            countSql.append(" AND g.name IN (:groups) ");
            params.put("groups", queryDto.getGroups());
        }

        sql.append(" ORDER BY m.create_date DESC ");

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        // 查询数据
        List<MindMapDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            MindMapDto dto = new MindMapDto();
            dto.setId(rs.getString("id"));
            dto.setMapName(rs.getString("map_name"));
            dto.setDescr(rs.getString("descr"));
            dto.setMapData(rs.getString("map_data"));
            dto.setGroupName(rs.getString("group_name"));
            dto.setGroupLabel(rs.getString("group_label"));
            dto.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(
                    rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        // 获取总数
        Long total = namedParameterJdbcTemplate.queryForObject(countSql.toString(), params, Long.class);

        return new PageImpl<>(list,
                org.springframework.data.domain.PageRequest.of(queryDto.getPageNum(), queryDto.getPageSize()),
                total != null ? total : 0);
    }

    @Override
    protected MindMapDto newDto() {
        return new MindMapDto();
    }

    @Override
    protected MindMap newModel() {
        return new MindMap();
    }

    @Override
    public SseEmitter streamGenerateMindMap(String descr) {
        SseEmitter emitter = new SseEmitter(0L);
        // 在新线程中执行生成并实时流式发送
        new Thread(() -> {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.findAndRegisterModules(); // 自动注册所有可用的模块，包括 JavaTimeModule
            try {
                OpenAiChatModel chatModel;
                try {
                    // 查询模型配置
                    chatModel = llmModelService.getChatModel(null);
                } catch (Exception ex) {
                    try {
                        emitter.send("[ERROR]" + ex.getMessage());
                    } catch (Exception sendEx) {
                        log.error("发送错误消息失败", sendEx);
                    }
                    emitter.completeWithError(ex);
                    return;
                }

                ChatClient chat = ChatClient.builder(chatModel).build();

                // 使用流式 API 调用大模型，实时推送内容到前端
                StringBuilder fullContent = new StringBuilder();
                int maxRetries = 3;
                long retryDelayMs = 1000L;
                int attempt = 0;
                Exception lastException = null;

                while (attempt < maxRetries) {
                    boolean finished = false;
                    try {
                        attempt++;
                        // 每次重试前清空之前累积的内容
                        fullContent.setLength(0);
                        String prompt = buildMindMapPrompt(descr);

                        // 推送重试日志到前端（仅重试时推送，首次不推）
                        if (attempt > 1) {
                            try {
                                emitter.send("[RETRY]第" + attempt + "次重试AI生成思维导图...");
                            } catch (Exception e) {
                                log.error("发送重试消息失败", e);
                            }
                        }

                        // 使用流式调用
                        chat.prompt()
                                .user(prompt)
                                .stream()
                                .content() // 流式获取内容
                                .doOnNext(chunk -> {
                                    try {
                                        // 实时推送流式内容（token/chunk）到前端
                                        emitter.send(chunk);
                                        // 同时累积完整内容用于最后解析
                                        fullContent.append(chunk);
                                    } catch (Exception e) {
                                        // 推送失败时记录但继续接收流
                                        System.err.println("Failed to send chunk: " + e.getMessage());
                                    }
                                })
                                .blockLast(); // 阻塞等待流完成

                        String content = fullContent.toString().trim();

                        try {
                            // 尝试提取JSON部分 (兼容可能存在的Markdown代码块包裹)
                            if (content.contains("```json")) {
                                content = content.substring(content.indexOf("```json") + 7);
                                if (content.contains("```")) {
                                    content = content.substring(0, content.indexOf("```"));
                                }
                            } else if (content.contains("```")) {
                                content = content.substring(content.indexOf("```") + 3);
                                if (content.contains("```")) {
                                    content = content.substring(0, content.indexOf("```"));
                                }
                            }
                            content = content.trim();

                            // 验证 JSON 格式并压缩
                            Object jsonObject = objectMapper.readValue(content, Object.class);
                            String minifiedJson = objectMapper.writeValueAsString(jsonObject);

                            // 发送特定的解析标记和最终数据
                            try {
                                emitter.send("\n\n[PARSE_RESULT]\n");
                            } catch (Exception e) {
                                log.error("发送解析结果分隔符失败", e);
                            }

                            try {
                                emitter.send("[MINDMAP]" + minifiedJson);
                            } catch (Exception sendEx) {
                                log.error("发送解析结果失败", sendEx);
                            }

                            emitter.complete();
                            finished = true;
                            break; // 成功完成，退出重试循环
                        } catch (Exception parseEx) {
                            // 将 JSON 解析失败视为一次失败，记录异常用于最终上报
                            lastException = parseEx;
                            // 如果还可以重试，则发送重试日志并继续重试（不要关闭 emitter）
                            if (attempt < maxRetries) {
                                try {
                                    emitter.send("[RETRY]解析 JSON 失败，第" + (attempt + 1) + "次重试...");
                                } catch (Exception e) {
                                    log.error("发送JSON解析失败重试消息失败", e);
                                }
                                try {
                                    Thread.sleep(retryDelayMs);
                                } catch (InterruptedException ie) {
                                    Thread.currentThread().interrupt();
                                    try {
                                        emitter.send("[ERROR]重试被中断: " + ie.getMessage());
                                    } catch (Exception ex) {
                                        log.error("发送重试被中断错误消息失败", ex);
                                    }
                                    emitter.completeWithError(new RuntimeException("重试被中断", ie));
                                    return;
                                }
                                // 继续下一次重试循环
                                continue;
                            } else {
                                // 最后一次重试且解析失败，走到外层统一处理
                            }
                        }
                    } catch (Exception e) {
                        lastException = e;
                        // 只要不是最后一次重试，不能关闭emitter
                        if (attempt < maxRetries) {
                            try {
                                Thread.sleep(retryDelayMs);
                            } catch (InterruptedException ie) {
                                Thread.currentThread().interrupt();
                                try {
                                    emitter.send("[ERROR]重试被中断: " + ie.getMessage());
                                } catch (Exception ex) {
                                    log.error("发送重试被中断错误消息失败", ex);
                                }
                                emitter.completeWithError(new RuntimeException("重试被中断", ie));
                                return;
                            }
                        }
                    }
                }
                // 只有所有重试都失败时才关闭emitter并推送错误
                if (attempt >= maxRetries) {
                    try {
                        emitter.send("[ERROR]生成思维导图失败，重试次数已达上限: "
                                + (lastException != null ? lastException.getMessage() : "未知错误"));
                    } catch (Exception ex) {
                        log.error("发送重试次数达上限错误消息失败", ex);
                    }
                    emitter.completeWithError(new RuntimeException("生成思维导图失败，重试次数已达上限", lastException));
                }
            } catch (Exception e) {
                log.error("生成思维导图服务异常", e);
                try {
                    emitter.send("[ERROR]服务异常: " + e.getMessage());
                } catch (Exception ex) {
                    log.error("发送服务异常错误消息失败", ex);
                }
                try {
                    emitter.completeWithError(e);
                } catch (Exception ex) {
                    log.error("完成SSE发送并返回错误失败", ex);
                }
            }
        }).start();
        return emitter;
    }

    private String buildMindMapPrompt(String descr) {
        PromptTemplateDto promptTemplateDto = promptTemplateService.getByName("mindMapGenerate");
        String targetPrompt = promptTemplateDto.getContent().replace("{{descr}}", descr);
        return targetPrompt;
    }

}