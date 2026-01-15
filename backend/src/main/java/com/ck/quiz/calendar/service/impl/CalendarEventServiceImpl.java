package com.ck.quiz.calendar.service.impl;

import com.ck.quiz.calendar.dto.CalendarEventCreateDto;
import com.ck.quiz.calendar.dto.CalendarEventDto;
import com.ck.quiz.calendar.dto.CalendarEventQueryDto;
import com.ck.quiz.calendar.dto.CalendarEventUpdateDto;
import com.ck.quiz.calendar.entity.CalendarEvent;
import com.ck.quiz.calendar.repository.CalendarEventRepository;
import com.ck.quiz.calendar.service.CalendarEventService;
import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 日程管理服务实现类
 */
@Service
public class CalendarEventServiceImpl implements CalendarEventService {

    private static final Logger log = LoggerFactory.getLogger(CalendarEventServiceImpl.class);

    @Autowired
    private CalendarEventRepository calendarEventRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Autowired
    private PromptTemplateService promptTemplateService;

    @Autowired
    private LLMModelRepository llmModelRepository;

    @Override
    @Transactional
    public CalendarEventDto createEvent(CalendarEventCreateDto createDto) {
        validateTimeRange(createDto.getStartTime(), createDto.getEndTime());
        CalendarEvent event = new CalendarEvent();
        event.setId(IdHelper.genUuid());
        event.setTitle(createDto.getTitle());
        event.setDescription(createDto.getDescription());
        event.setStatus(createDto.getStatus() != null ? createDto.getStatus() : CalendarEvent.Status.SCHEDULED);
        event.setStartTime(createDto.getStartTime());
        event.setEndTime(createDto.getEndTime());
        event.setAllDay(createDto.getAllDay() != null ? createDto.getAllDay() : Boolean.FALSE);
        CalendarEvent saved = calendarEventRepository.save(event);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public CalendarEventDto updateEvent(CalendarEventUpdateDto updateDto) {
        Optional<CalendarEvent> optionalEvent = calendarEventRepository.findById(updateDto.getId());
        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("事件不存在，ID: " + updateDto.getId());
        }
        CalendarEvent event = optionalEvent.get();

        if (StringUtils.hasText(updateDto.getTitle())) {
            event.setTitle(updateDto.getTitle());
        }
        if (updateDto.getDescription() != null) {
            event.setDescription(updateDto.getDescription());
        }
        if (updateDto.getStatus() != null) {
            event.setStatus(updateDto.getStatus());
        }
        if (updateDto.getStartTime() != null) {
            event.setStartTime(updateDto.getStartTime());
        }
        if (updateDto.getEndTime() != null) {
            event.setEndTime(updateDto.getEndTime());
        }
        if (updateDto.getAllDay() != null) {
            event.setAllDay(updateDto.getAllDay());
        }
        if (updateDto.getCompletedAt() != null) {
            event.setCompletedAt(updateDto.getCompletedAt());
        }

        validateTimeRange(event.getStartTime(), event.getEndTime());

        CalendarEvent saved = calendarEventRepository.save(event);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public CalendarEventDto deleteEvent(String eventId) {
        Optional<CalendarEvent> optionalEvent = calendarEventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("事件不存在，ID: " + eventId);
        }
        CalendarEvent event = optionalEvent.get();
        calendarEventRepository.delete(event);
        return convertToDto(event);
    }

    @Override
    @Transactional
    public CalendarEventDto completeEvent(String eventId, LocalDateTime completedAt) {
        Optional<CalendarEvent> optionalEvent = calendarEventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("事件不存在，ID: " + eventId);
        }
        CalendarEvent event = optionalEvent.get();
        event.setStatus(CalendarEvent.Status.COMPLETED);
        event.setCompletedAt(completedAt != null ? completedAt : LocalDateTime.now());
        CalendarEvent saved = calendarEventRepository.save(event);
        return convertToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public CalendarEventDto getEventById(String eventId) {
        Optional<CalendarEvent> optionalEvent = calendarEventRepository.findById(eventId);
        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("事件不存在，ID: " + eventId);
        }
        return convertToDto(optionalEvent.get());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<CalendarEventDto> searchEvents(CalendarEventQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT e.event_id AS id, e.title, e.description, e.status, e.start_time, e.end_time, e.all_day, " +
                        "e.create_date, e.create_user, e.update_date, e.update_user, e.completed_at, u.user_name create_user_name " +
                        "FROM calendar_event e LEFT JOIN users u ON u.user_id = e.create_user "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM calendar_event e "
        );

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        JdbcQueryHelper.lowerLike("titleKey", queryDto.getTitle(), " AND LOWER(e.title) LIKE :titleKey ", params, jdbcTemplate, sql, countSql);

        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus().name(), " AND e.status = :status ", params, sql, countSql);
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
            JdbcQueryHelper.equals("createUser", authentication.getName(), " AND e.create_user = :createUser ", params, sql, countSql);
        }

        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<CalendarEventDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            CalendarEventDto dto = new CalendarEventDto();
            dto.setId(rs.getString("id"));
            dto.setTitle(rs.getString("title"));
            dto.setDescription(rs.getString("description"));
            dto.setStatus(rs.getString("status") != null ? CalendarEvent.Status.valueOf(rs.getString("status")) : null);
            dto.setStartTime(rs.getTimestamp("start_time") != null ? rs.getTimestamp("start_time").toLocalDateTime() : null);
            dto.setEndTime(rs.getTimestamp("end_time") != null ? rs.getTimestamp("end_time").toLocalDateTime() : null);
            dto.setAllDay(rs.getObject("all_day") != null ? rs.getBoolean("all_day") : null);
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            dto.setCompletedAt(rs.getTimestamp("completed_at") != null ? rs.getTimestamp("completed_at").toLocalDateTime() : null);
            return dto;
        });

        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public CalendarEventDto convertToDto(CalendarEvent calendarEvent) {
        CalendarEventDto dto = new CalendarEventDto();
        BeanUtils.copyProperties(calendarEvent, dto);
        return dto;
    }

    private void validateTimeRange(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime != null && endTime != null && endTime.isBefore(startTime)) {
            throw new RuntimeException("结束时间不能早于开始时间");
        }
    }

    /**
     * 解析模型配置
     * 
     * @param modelName 模型名称（可选）
     * @return 模型配置，如果未指定模型名则返回默认模型
     */
    private LLMModel resolveModel(String modelName) {
        if (StringUtils.hasText(modelName)) {
            return llmModelRepository.findByName(modelName).orElse(null);
        } else {
            return llmModelRepository.findByTypeAndIsDefault(LLMModel.ModelType.TEXT, "1").orElse(null);
        }
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
        // 在新线程中执行生成并实时流式发送
        new Thread(() -> {
            ObjectMapper objectMapper = new ObjectMapper();
            objectMapper.findAndRegisterModules(); // 自动注册所有可用的模块，包括 JavaTimeModule
            try {
                // 查询模型配置
                LLMModel model = resolveModel(null);
                if (model == null) {
                    try {
                        emitter.send("[ERROR]未找到指定的文本模型，请先在模型管理中配置模型");
                    } catch (Exception ex) {
                        log.error("发送错误消息失败", ex);
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

                        // 流式内容接收完毕后，尝试解析最终的 JSON 结果
                        String content = fullContent.toString().trim();

                        try {
                            // 尝试解析 JSON（假设模型最后输出的是 JSON 对象）
                            CalendarEventCreateDto eventDto = objectMapper.readValue(content, CalendarEventCreateDto.class);

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
                        emitter.send("[ERROR]生成日程失败，重试次数已达上限: " + (lastException != null ? lastException.getMessage() : "未知错误"));
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
