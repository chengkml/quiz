package com.ck.quiz.todo.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.mindmap.dto.MindMapDto;
import com.ck.quiz.mindmap.entity.MindMap;
import com.ck.quiz.mindmap.repository.MindMapRepository;
import com.ck.quiz.mindmap.service.MindMapService;
import com.ck.quiz.todo.dto.TodoCreateDto;
import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.todo.dto.TodoQueryDto;
import com.ck.quiz.todo.dto.TodoUpdateDto;
import com.ck.quiz.todo.entity.Todo;
import com.ck.quiz.todo.repository.TodoRepository;
import com.ck.quiz.todo.service.TodoService;
import com.ck.quiz.utils.JdbcQueryHelper;

import com.ck.quiz.calendar.dto.CalendarEventCreateDto;
import com.ck.quiz.calendar.dto.CalendarEventDto;
import com.ck.quiz.calendar.entity.CalendarEvent;
import com.ck.quiz.calendar.service.CalendarEventService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;

import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 待办管理服务实现类
 */
@Slf4j
@Service
@Transactional
public class TodoServiceImpl
        extends BaseServiceImpl<TodoCreateDto, TodoUpdateDto, TodoQueryDto, TodoDto, Todo, TodoRepository>
        implements TodoService {

    @Autowired
    private TodoRepository todoRepository;

    @Lazy
    @Autowired
    private CalendarEventService calendarEventService;

    @Lazy
    @Autowired
    private MindMapService mindMapService;

    @Lazy
    @Autowired
    private MindMapRepository mindMapRepository;

    @Override
    public TodoDto create(TodoCreateDto createDto) {
        TodoDto dto = super.create(createDto);

        // 如果是同步创建的，不再触发反向同步
        if (Boolean.TRUE.equals(createDto.getIsSync())) {
            // 如果传入了 calendarEventId，更新当前的 calendarEventId
            if (createDto.getCalendarEventId() != null) {
                Todo todo = todoRepository.findById(dto.getId()).orElse(null);
                if (todo != null) {
                    todo.setCalendarEventId(createDto.getCalendarEventId());
                    todoRepository.save(todo);
                    dto.setCalendarEventId(createDto.getCalendarEventId());
                }
            }
            return dto;
        }

        try {
            // 同步创建日程
            CalendarEventCreateDto eventDto = new CalendarEventCreateDto();
            eventDto.setTitle(createDto.getTitle());
            eventDto.setDescr(createDto.getDescr());
            eventDto.setIsSync(true); // 标记为同步
            eventDto.setTodoId(dto.getId()); // 设置关联的待办ID

            // 时间处理：优先使用startTime，其次dueDate，默认当前时间
            LocalDateTime start = createDto.getStartTime();
            if (start == null) {
                start = createDto.getDueDate();
            }
            if (start == null) {
                start = LocalDateTime.now();
            }

            eventDto.setStartTime(start);
            eventDto.setEndTime(start.plusHours(1)); // 默认持续1小时
            eventDto.setAllDay(false);
            eventDto.setStatus(CalendarEvent.Status.SCHEDULED);

            CalendarEventDto createdEvent = calendarEventService.create(eventDto);

            // 回填 calendarEventId
            Todo todo = todoRepository.findById(dto.getId()).orElse(null);
            if (todo != null && createdEvent != null) {
                todo.setCalendarEventId(createdEvent.getId());
                todoRepository.save(todo);
                dto.setCalendarEventId(createdEvent.getId());
            }
        } catch (Exception e) {
            // 同步失败不影响主流程，仅记录日志
            log.error("Failed to sync todo to schedule: {}", e.getMessage());
        }

        return dto;
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        Optional<Todo> op = todoRepository.findById(id);
        if (op.isEmpty()) {
            return;
        }
        Todo todo = op.get();
        String calendarEventId = todo.getCalendarEventId();

        super.delete(userId, id);
        todoRepository.flush();

        if (calendarEventId != null && !calendarEventId.isEmpty()) {
            try {
                calendarEventService.delete(userId, calendarEventId);
            } catch (Exception e) {
                log.warn("Failed to delete linked calendar event: {}", e.getMessage());
            }
        }
    }

    @Override
    public Page<TodoDto> search(String userId, TodoQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT t.* FROM todo t WHERE 1=1 ");

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM todo t WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        // 动态条件
        JdbcQueryHelper.lowerLike("titleKey", queryDto.getTitle(), " AND LOWER(t.title) LIKE :titleKey ", params,
                namedParameterJdbcTemplate, sql, countSql);

        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus().name(), " AND t.status = :status ", params, sql,
                    countSql);
        }

        if (queryDto.getPriority() != null) {
            JdbcQueryHelper.equals("priority", queryDto.getPriority().name(), " AND t.priority = :priority ", params,
                    sql, countSql);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(), " AND t.create_user = :createUser ", params,
                    sql, countSql);
        }

        // 排序
        JdbcQueryHelper.order("create_date", "desc", sql);

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(),
                queryDto.getPageSize());

        List<TodoDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            Todo todo = new Todo();
            todo.setId(rs.getString("id"));
            todo.setTitle(rs.getString("title"));
            todo.setDescr(rs.getString("descr"));
            todo.setStatus(rs.getString("status") != null ? Todo.Status.valueOf(rs.getString("status")) : null);
            todo.setPriority(rs.getString("priority") != null ? Todo.Priority.valueOf(rs.getString("priority")) : null);
            todo.setDueDate(rs.getTimestamp("due_date") != null ? rs.getTimestamp("due_date").toLocalDateTime() : null);
            todo.setCalendarEventId(rs.getString("calendar_event_id"));
            todo.setCreateDate(
                    rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            todo.setCreateUser(rs.getString("create_user"));
            todo.setUpdateDate(
                    rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            todo.setUpdateUser(rs.getString("update_user"));
            return convertToDto(todo, true);
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list,
                queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    protected TodoDto newDto() {
        return new TodoDto();
    }

    @Override
    protected Todo newModel() {
        return new Todo();
    }

    @Override
    public MindMapDto initMindMap(String todoId) {
        Optional<MindMap> op = mindMapRepository.findById(todoId);
        if (op.isPresent()) {
            return mindMapService.get(op.get().getCreateUser(), todoId);
        }
        Optional<Todo> optionalTodo = todoRepository.findById(todoId);
        if (optionalTodo.isEmpty()) {
            throw new RuntimeException("待办不存在，ID: " + todoId);
        }
        Todo todo = optionalTodo.get();
        MindMap mindMap = new MindMap();
        mindMap.setId(todoId);
        mindMap.setMapName(todo.getTitle());
        mindMap.setDescr(todo.getDescr());
        mindMap.setMapData(loadTemplate(todo.getTitle(), "templates/mind_map_init.tpl"));

        // 设置创建人和拥有者信息
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String currentUsername = authentication.getName();
            mindMap.setCreateUser(currentUsername);
        }

        mindMap.setCreateDate(LocalDateTime.now());
        mindMap.setUpdateDate(LocalDateTime.now());

        MindMap updatedMindMap = mindMapRepository.save(mindMap);
        return mindMapService.convertToDto(updatedMindMap, true);
    }

    @Override
    public TodoDto complete(String userId, String id) {
        Optional<Todo> optionalTodo = todoRepository.findById(id);
        if (optionalTodo.isEmpty()) {
            throw new RuntimeException("待办不存在，ID: " + id);
        }
        Todo todo = optionalTodo.get();
        todo.setStatus(Todo.Status.COMPLETED);
        todo.setUpdateUser(userId);
        todo.setUpdateDate(LocalDateTime.now());
        Todo updatedTodo = todoRepository.save(todo);
        return convertToDto(updatedTodo, true);
    }

    private String loadTemplate(String title, String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
                String jsonStr = FileCopyUtils.copyToString(reader);
                return jsonStr.replace("{{title}}", title);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        } catch (Exception e) {
            throw new RuntimeException("读取模板文件失败: " + path, e);
        }
    }
}