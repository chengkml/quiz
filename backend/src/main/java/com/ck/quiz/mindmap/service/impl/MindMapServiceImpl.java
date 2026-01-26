package com.ck.quiz.mindmap.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.mindmap.dto.*;
import com.ck.quiz.mindmap.entity.MindMap;
import com.ck.quiz.mindmap.repository.MindMapRepository;
import com.ck.quiz.mindmap.service.MindMapService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
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
    private PromptTemplateService promptTemplateService;

    @Autowired
    private com.ck.quiz.llmmodel.service.LLMModelService llmModelService;

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
        return convertToDto(updatedMindMap, true);
    }

    @Override
    public Page<MindMapDto> search(String userId, MindMapQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT m.id, m.map_name, m.descr, m.map_data, " +
                        "m.create_date, m.create_user, u.user_name create_user_name, m.update_date, m.update_user " +
                        "FROM mind_map m left join users u on u.user_id = m.create_user ");

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM mind_map m ");

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
                                .content()  // 流式获取内容
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
                                .blockLast();  // 阻塞等待流完成

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
                            break;  // 成功完成，退出重试循环
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
                        emitter.send("[ERROR]生成思维导图失败，重试次数已达上限: " + (lastException != null ? lastException.getMessage() : "未知错误"));
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