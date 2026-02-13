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
import com.ck.quiz.todo.dto.TodoCreateDto;
import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.todo.entity.Todo;
import com.ck.quiz.todo.service.TodoService;
import com.ck.quiz.prompt.dto.PromptTemplateDto;
import com.ck.quiz.prompt.service.PromptTemplateService;
import com.ck.quiz.utils.JdbcQueryHelper;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

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

    @Lazy
    @Autowired
    private TodoService todoService;

    @Override
    public CalendarEventDto create(CalendarEventCreateDto createDto) {
        CalendarEventDto dto = super.create(createDto);

        // 如果是同步创建的，不再触发反向同步
        if (Boolean.TRUE.equals(createDto.getIsSync())) {
            // 如果传入了 todoId，更新当前的 todoId
            if (createDto.getTodoId() != null) {
                CalendarEvent event = calendarEventRepository.findById(dto.getId()).orElse(null);
                if (event != null) {
                    event.setTodoId(createDto.getTodoId());
                    calendarEventRepository.save(event);
                    dto.setTodoId(createDto.getTodoId());
                }
            }
            return dto;
        }

        try {
            // 同步创建待办
            TodoCreateDto todoDto = new TodoCreateDto();
            todoDto.setTitle(createDto.getTitle());
            todoDto.setDescr(createDto.getDescr());
            todoDto.setIsSync(true); // 标记为同步
            todoDto.setStartTime(createDto.getStartTime());
            todoDto.setDueDate(createDto.getEndTime());
            todoDto.setStatus(Todo.Status.SCHEDULED);
            todoDto.setPriority(Todo.Priority.MEDIUM);
            todoDto.setCalendarEventId(dto.getId()); // 设置关联的日程ID

            TodoDto createdTodo = todoService.create(todoDto);
            
            // 回填 todoId
            CalendarEvent event = calendarEventRepository.findById(dto.getId()).orElse(null);
            if (event != null && createdTodo != null) {
                event.setTodoId(createdTodo.getId());
                calendarEventRepository.save(event);
                dto.setTodoId(createdTodo.getId());
            }
        } catch (Exception e) {
            log.error("Failed to sync schedule to todo: {}", e.getMessage());
        }

        return dto;
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        Optional<CalendarEvent> op = calendarEventRepository.findById(id);
        if (op.isEmpty()) {
            return;
        }
        CalendarEvent event = op.get();
        String todoId = event.getTodoId();

        super.delete(userId, id);
        calendarEventRepository.flush();

        if (todoId != null && !todoId.isEmpty()) {
            try {
                todoService.delete(userId, todoId);
            } catch (Exception e) {
                log.warn("Failed to delete linked todo: {}", e.getMessage());
            }
        }
    }

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
            event.setTodoId(rs.getString("todo_id"));
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
    public Flux<String> streamGenerateEvent(String descr) {
        // 1. 获取基础配置（这部分是同步的，可以直接写）
        OpenAiChatModel chatModel = llmModelService.getChatModel(null);
        ChatClient chat = ChatClient.builder(chatModel).build();
        String prompt = buildEventPrompt(descr);

        // 用来记录完整内容，最后解析 JSON
        StringBuilder fullContent = new StringBuilder();
        ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

        // 2. 直接返回 ChatClient 的流，利用响应式操作符进行副作用处理
        return chat.prompt()
                .user(prompt)
                .stream()
                .content()
                .doOnSubscribe(s -> log.info("[Calendar] Stream generation started"))
                .doOnNext(chunk -> {
                    log.info("[Calendar] Received chunk: {}", chunk);
                    fullContent.append(chunk);
                })
                // 使用 concatWith 在流结束前插入解析结果
                .concatWith(Flux.defer(() -> {
                    // 当主流完成时，这个 lambda 会执行
                    String content = fullContent.toString().trim();
                    try {
                        CalendarEventCreateDto eventDto = objectMapper.readValue(content, CalendarEventCreateDto.class);
                        String json = objectMapper.writeValueAsString(eventDto);
                        return Flux.just("\n\n[PARSE_RESULT]\n", "[EVENT]" + json);
                    } catch (Exception parseEx) {
                        log.error("[Calendar] JSON parse error", parseEx);
                        return Flux.just("[ERROR]解析JSON失败: " + parseEx.getMessage());
                    }
                }))
                .doOnComplete(() -> log.info("[Calendar] Stream completion"))
                .doOnError(err -> log.error("[Calendar] Stream error", err))
                // 如果出错，把错误信息也转成字符串发给前端
                .onErrorResume(e -> Flux.just("[ERROR]服务异常: " + e.getMessage()));
    }
}
