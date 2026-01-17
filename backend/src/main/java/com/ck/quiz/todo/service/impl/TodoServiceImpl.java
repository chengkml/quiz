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
@Service
@Transactional
public class TodoServiceImpl extends BaseServiceImpl<TodoCreateDto, TodoUpdateDto, TodoQueryDto, TodoDto, Todo, TodoRepository> implements TodoService {

    @Autowired
    private TodoRepository todoRepository;

    @Lazy
    @Autowired
    private MindMapService mindMapService;

    @Lazy
    @Autowired
    private MindMapRepository mindMapRepository;

    @Override
    public Page<TodoDto> search(String userId, TodoQueryDto queryDto) {
        StringBuilder sql = new StringBuilder(
                "SELECT t.* FROM todo t WHERE 1=1 "
        );

        StringBuilder countSql = new StringBuilder(
                "SELECT COUNT(1) FROM todo t WHERE 1=1 "
        );

        Map<String, Object> params = new HashMap<>();

        // 动态条件
        JdbcQueryHelper.lowerLike("titleKey", queryDto.getTitle(), " AND LOWER(t.title) LIKE :titleKey ", params, namedParameterJdbcTemplate, sql, countSql);

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
        JdbcQueryHelper.order("create_date", "desc", sql);

        // 分页
        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());

        List<TodoDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            TodoDto dto = new TodoDto();
            dto.setId(rs.getString("id"));
            dto.setTitle(rs.getString("title"));
            dto.setDescription(rs.getString("description"));
            dto.setStatus(rs.getString("status") != null ? Todo.Status.valueOf(rs.getString("status")) : null);
            dto.setPriority(rs.getString("priority") != null ? Todo.Priority.valueOf(rs.getString("priority")) : null);
            dto.setDueDate(rs.getTimestamp("due_date") != null ? rs.getTimestamp("due_date").toLocalDateTime() : null);
            dto.setCreateDate(rs.getTimestamp("create_date") != null ? rs.getTimestamp("create_date").toLocalDateTime() : null);
            dto.setCreateUser(rs.getString("create_user"));
            dto.setUpdateDate(rs.getTimestamp("update_date") != null ? rs.getTimestamp("update_date").toLocalDateTime() : null);
            dto.setUpdateUser(rs.getString("update_user"));
            return dto;
        });

        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
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