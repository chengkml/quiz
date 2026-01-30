package com.ck.quiz.calendar.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.calendar.dto.CalendarEventCreateDto;
import com.ck.quiz.calendar.dto.CalendarEventDto;
import com.ck.quiz.calendar.dto.CalendarEventQueryDto;
import com.ck.quiz.calendar.dto.CalendarEventUpdateDto;
import com.ck.quiz.calendar.entity.CalendarEvent;
import com.ck.quiz.calendar.repository.CalendarEventRepository;
import com.ck.quiz.calendar.service.CalendarEventService;
import com.ck.quiz.llmmodel.service.LLMModelService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
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
import java.util.Optional;

@Slf4j
@Service
@Transactional
public class CalendarEventServiceImpl
        extends
        BaseServiceImpl<CalendarEventCreateDto, CalendarEventUpdateDto, CalendarEventQueryDto, CalendarEventDto, CalendarEvent, CalendarEventRepository>
        implements CalendarEventService {

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private PromptTemplateService promptTemplateService;

    @Autowired
    private LLMModelService llmModelService;

    @Override
    public Page<CalendarEventDto> search(String userId, CalendarEventQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT e.* FROM calendar_event e WHERE 1=1 ");

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM calendar_event e WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        // 动态条件
        JdbcQueryHelper.lowerLike("titleKey", queryDto.getTitle(), " AND LOWER(e.title) LIKE :titleKey ", params,
                namedParameterJdbcTemplate, sql, countSql);

        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus().name(), " AND e.status = :status ", params, sql,
                    countSql);
        }

        if (queryDto.getStartTimeFrom() != null) {
            sql.append(" AND e.start_time >= :startTimeFrom ");
            countSql.append(" AND e.start_time >= :startTimeFrom ");
            params.put("startTimeFrom", queryDto.getStartTimeFrom());
        }

        if (queryDto.getStartTimeTo() != null) {
            sql.append(" AND e.start_time <= :startTimeTo ");
            countSql.append(" AND e.start_time <= :startTimeTo ");
            params.put("startTimeTo", queryDto.getStartTimeTo());
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(), " AND e.create_user = :createUser ", params,
                    sql, countSql);
        }

        // 排序
        JdbcQueryHelper.order("create_date", "desc", sql);

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        List<CalendarEventDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            CalendarEvent event = new CalendarEvent();
            event.setId(rs.getString("id"));
            event.setTitle(rs.getString("title"));
            event.setDescr(rs.getString("descr"));
            event.setStatus(
                    rs.getString("status") != null ? CalendarEvent.Status.valueOf(rs.getString("status")) : null);
            event.setStartTime(
                    rs.getTimestamp("start_time") != null ? rs.getTimestamp("start_time").toLocalDateTime() : null);
            event.setEndTime(
                    rs.getTimestamp("end_time") != null ? rs.getTimestamp("end_time").toLocalDateTime() : null);
            event.setAllDay(rs.getObject("all_day") != null ? rs.getBoolean("all_day") : null);
            event.setCompletedAt(
                    rs.getTimestamp("completed_at") != null ? rs.getTimestamp("completed_at").toLocalDateTime() : null);
            event.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            event.setCreateUser(rs.getString("create_user"));
            event.setUpdateDate(
                    rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            event.setUpdateUser(rs.getString("update_user"));
            return convertToDto(event, true);
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    protected CalendarEventDto newDto() {
        return new CalendarEventDto();
    }

    @Override
    protected CalendarEvent newModel() {
        return new CalendarEvent();
    }

    @Override
    public CalendarEventDto complete(String userId, String eventId) {
        Optional<CalendarEvent> optionalEvent = calendarEventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("事件不存在，ID: " + eventId);
        }
        CalendarEvent event = optionalEvent.get();
        event.setStatus(CalendarEvent.Status.COMPLETED);
        event.setCompletedAt(LocalDateTime.now());
        CalendarEvent saved = calendarEventRepository.save(event);
        return convertToDto(saved, true);
    }

    private String buildEventPrompt(String eventDescription) {
        PromptTemplateDto promptTemplateDto = promptTemplateService.getByName("calendarEventGenerate");
        String targetPrompt = promptTemplateDto.getContent().replace("{{eventDescr}}", eventDescription);
        String dateTime = LocalDateTime.now().toString();
        targetPrompt = targetPrompt.replace("{{currentDateTime}}", dateTime);
        return targetPrompt;
    }

    @Override
    public SseEmitter streamGenerateEvent(String descr) {
        SseEmitter emitter = new SseEmitter(0L);
        try {
            // 发送初始连接事件，强制刷新响应头，防止Nginx/代理缓存导致无数据
            emitter.send(SseEmitter.event().name("connect").data("connected"));
        } catch (Exception e) {
            log.warn("发送初始连接事件失败", e);
        }
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
                        final int currentAttempt = attempt;
                        // 每次重试前清空之前累积的内容
                        fullContent.setLength(0);
                        String prompt = buildEventPrompt(descr);

                        // 推送重试日志到前端（仅重试时推送，首次不推）
                        if (attempt > 1) {
                            try {
                                emitter.send("[RETRY]第" + attempt + "次重试AI生成日程...");
                            } catch (Exception e) {
                                log.error("发送重试消息失败", e);
                            }
                        }

                        // 使用流式调用
                        chat.prompt()
                                .user(prompt)
                                .stream()
                                .content() // 流式获取内容
                                .doOnSubscribe(
                                        s -> log.info("[Calendar] Stream generation started (attempt {})",
                                                currentAttempt))
                                .doOnNext(chunk -> {
                                    log.info("[Calendar] Received chunk: {}", chunk);
                                    try {
                                        // 实时推送流式内容（token/chunk）到前端
                                        emitter.send(chunk);
                                        // 同时累积完整内容用于最后解析
                                        fullContent.append(chunk);
                                    } catch (Exception e) {
                                        // 推送失败时记录但继续接收流
                                        log.error("[Calendar] Error sending chunk", e);
                                    }
                                })
                                .doOnError(err -> log.error("[Calendar] Stream error", err))
                                .doOnComplete(() -> log.info("[Calendar] Stream completion"))
                                .blockLast(); // 阻塞等待流完成

                        // 流式内容接收完毕后，尝试解析最终的 JSON 结果
                        String content = fullContent.toString().trim();

                        try {
                            // 尝试解析 JSON（假设模型最后输出的是 JSON 对象）
                            CalendarEventCreateDto eventDto = objectMapper.readValue(content,
                                    CalendarEventCreateDto.class);

                            // 解析成功后，推送一个分隔符，告诉前端开始解析最终结果
                            try {
                                emitter.send("\n\n[PARSE_RESULT]\n");
                            } catch (Exception e) {
                                log.error("发送解析结果分隔符失败", e);
                            }

                            // 推送解析结果
                            try {
                                String json = objectMapper.writeValueAsString(eventDto);
                                // 使用特殊前缀标记这是解析完毕的完整日程对象
                                emitter.send("[EVENT]" + json);
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
                        emitter.send("[ERROR]生成日程失败，重试次数已达上限: "
                                + (lastException != null ? lastException.getMessage() : "未知错误"));
                    } catch (Exception ex) {
                        log.error("发送重试次数达上限错误消息失败", ex);
                    }
                    emitter.completeWithError(new RuntimeException("生成日程失败，重试次数已达上限", lastException));
                }
            } catch (Exception e) {
                log.error("生成日程服务异常", e);
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
}
