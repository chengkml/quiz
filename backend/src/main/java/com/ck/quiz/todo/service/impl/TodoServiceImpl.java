package com.ck.quiz.todo.service.impl;

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
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;
import org.springframework.util.StringUtils;

import java.io.InputStream;
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
@Service
public class TodoServiceImpl implements TodoService {

    @Autowired
    private TodoRepository todoRepository;

    @Autowired
    private NamedParameterJdbcTemplate jdbcTemplate;

    @Lazy
    @Autowired
    private MindMapService mindMapService;

    @Lazy
    @Autowired
    private MindMapRepository mindMapRepository;

    @Override
    @Transactional
    public TodoDto createTodo(TodoCreateDto todoCreateDto) {
        Todo todo = new Todo();
        todo.setId(IdHelper.genUuid());
        todo.setTitle(todoCreateDto.getTitle());
        todo.setDescription(todoCreateDto.getDescription());
        todo.setStatus(todoCreateDto.getStatus() != null ? todoCreateDto.getStatus() : Todo.Status.PENDING);
        todo.setPriority(todoCreateDto.getPriority() != null ? todoCreateDto.getPriority() : Todo.Priority.MEDIUM);
        todo.setDueDate(todoCreateDto.getDueDate());
        Todo saved = todoRepository.save(todo);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public TodoDto updateTodo(TodoUpdateDto todoUpdateDto) {
        Optional<Todo> optionalTodo = todoRepository.findById(todoUpdateDto.getId());
        if (optionalTodo.isEmpty()) {
            throw new RuntimeException("待办不存在，ID: " + todoUpdateDto.getId());
        }
        Todo todo = optionalTodo.get();

        if (StringUtils.hasText(todoUpdateDto.getTitle())) {
            todo.setTitle(todoUpdateDto.getTitle());
        }
        if (todoUpdateDto.getDescription() != null) {
            todo.setDescription(todoUpdateDto.getDescription());
        }
        if (todoUpdateDto.getStatus() != null) {
            todo.setStatus(todoUpdateDto.getStatus());
        }
        if (todoUpdateDto.getPriority() != null) {
            todo.setPriority(todoUpdateDto.getPriority());
        }
        if (todoUpdateDto.getDueDate() != null) {
            todo.setDueDate(todoUpdateDto.getDueDate());
        }

        Todo saved = todoRepository.save(todo);
        return convertToDto(saved);
    }

    @Override
    @Transactional
    public TodoDto deleteTodo(String todoId) {
        Optional<Todo> optionalTodo = todoRepository.findById(todoId);
        if (optionalTodo.isEmpty()) {
            throw new RuntimeException("待办不存在，ID: " + todoId);
        }
        Todo todo = optionalTodo.get();
        todoRepository.delete(todo);
        return convertToDto(todo);
    }

    @Override
    @Transactional(readOnly = true)
    public TodoDto getTodoById(String todoId) {
        Optional<Todo> optionalTodo = todoRepository.findById(todoId);
        if (optionalTodo.isEmpty()) {
            throw new RuntimeException("待办不存在，ID: " + todoId);
        }
        return convertToDto(optionalTodo.get());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<TodoDto> searchTodos(TodoQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT t.todo_id AS id, t.title, t.description, t.status, t.priority, t.due_date, " +
                        "t.create_date, t.create_user, t.update_date, t.update_user, u.user_name create_user_name " +
                        "FROM todo t LEFT JOIN user u ON u.user_id = t.create_user "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM todo t "
        );

        sql.append(" WHERE 1=1 ");
        countSql.append(" WHERE 1=1 ");

        Map<String, Object> params = new HashMap<>();

        // 动态条件
        JdbcQueryHelper.lowerLike("titleKey", queryDto.getTitle(), " AND LOWER(t.title) LIKE :titleKey ", params, jdbcTemplate, sql, countSql);

        if (queryDto.getStatus() != null) {
            JdbcQueryHelper.equals("status", queryDto.getStatus().name(), " AND t.status = :status ", params, sql, countSql);
        }

        if (queryDto.getPriority() != null) {
            JdbcQueryHelper.equals("priority", queryDto.getPriority().name(), " AND t.priority = :priority ", params, sql, countSql);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            JdbcQueryHelper.equals("createUser", authentication.getName(), " AND t.create_user = :createUser ", params, sql, countSql);
        }

        // 排序
        JdbcQueryHelper.order(queryDto.getSortColumn(), queryDto.getSortType(), sql);

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(jdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<TodoDto> list = jdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            TodoDto dto = new TodoDto();
            dto.setId(rs.getString("id"));
            dto.setTitle(rs.getString("title"));
            dto.setDescription(rs.getString("description"));
            dto.setStatus(rs.getString("status") != null ? Todo.Status.valueOf(rs.getString("status")) : null);
            dto.setPriority(rs.getString("priority") != null ? Todo.Priority.valueOf(rs.getString("priority")) : null);
            dto.setDueDate(rs.getTimestamp("due_date") != null ? rs.getTimestamp("due_date").toLocalDateTime() : null);
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setCreateUserName(rs.getString("create_user_name"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        return JdbcQueryHelper.toPage(jdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    public TodoDto convertToDto(Todo todo) {
        TodoDto dto = new TodoDto();
        BeanUtils.copyProperties(todo, dto);
        return dto;
    }

    @Override
    public MindMapDto initMindMap(String todoId) {
        Optional<MindMap> op = mindMapRepository.findById(todoId);
        if (op.isPresent()) {
            return mindMapService.getMindMapById(todoId);
        }
        Optional<Todo> optionalTodo = todoRepository.findById(todoId);
        if (optionalTodo.isEmpty()) {
            throw new RuntimeException("待办不存在，ID: " + todoId);
        }
        Todo todo = optionalTodo.get();
        MindMap mindMap = new MindMap();
        mindMap.setId(todoId);
        mindMap.setMapName(todo.getTitle());
        mindMap.setDescription(todo.getDescription());
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
        return mindMapService.convertToDto(updatedMindMap);
    }

    private String loadTemplate(String title, String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
                String jsonStr = FileCopyUtils.copyToString(reader);
                return jsonStr.replace("{{title}}", title);
            }catch (Exception e) {
                throw new RuntimeException(e);
            }
        } catch (Exception e) {
            throw new RuntimeException("读取模板文件失败: " + path, e);
        }
    }
}