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
    public Flux<String> streamGenerateEvent(String descr) {
        return Flux.create(sink -> {
            try {
                // 发送初始连接消息
                sink.next("connected");

                ObjectMapper objectMapper = new ObjectMapper();
                objectMapper.findAndRegisterModules();

                OpenAiChatModel chatModel;
                try {
                    chatModel = llmModelService.getChatModel(null);
                } catch (Exception ex) {
                    sink.next("[ERROR]" + ex.getMessage());
                    sink.error(ex);
                    return;
                }

                ChatClient chat = ChatClient.builder(chatModel).build();
                StringBuilder fullContent = new StringBuilder();
                String prompt = buildEventPrompt(descr);

                // 使用流式调用
                chat.prompt()
                        .user(prompt)
                        .stream()
                        .content()
                        .doOnSubscribe(s -> log.info("[Calendar] Stream generation started"))
                        .doOnNext(chunk -> {
                            log.info("[Calendar] Received chunk: {}", chunk);
                            sink.next(chunk);
                            fullContent.append(chunk);
                        })
                        .doOnError(err -> {
                            log.error("[Calendar] Stream error", err);
                            sink.next("[ERROR]" + err.getMessage());
                            sink.error(err);
                        })
                        .doOnComplete(() -> {
                            log.info("[Calendar] Stream completion");
                            // 流式内容接收完毕后，尝试解析最终的 JSON 结果
                            String content = fullContent.toString().trim();
                            try {
                                CalendarEventCreateDto eventDto = objectMapper.readValue(content,
                                        CalendarEventCreateDto.class);
                                sink.next("\n\n[PARSE_RESULT]\n");
                                String json = objectMapper.writeValueAsString(eventDto);
                                sink.next("[EVENT]" + json);
                            } catch (Exception parseEx) {
                                log.error("[Calendar] JSON parse error", parseEx);
                                sink.next("[ERROR]解析JSON失败: " + parseEx.getMessage());
                            }
                            sink.complete();
                        })
                        .subscribe();
            } catch (Exception e) {
                log.error("[Calendar] 生成日程服务异常", e);
                sink.next("[ERROR]服务异常: " + e.getMessage());
                sink.error(e);
            }
        });
    }
}
