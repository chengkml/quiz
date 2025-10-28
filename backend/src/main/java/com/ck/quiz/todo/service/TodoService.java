package com.ck.quiz.todo.service;

import com.ck.quiz.mindmap.dto.MindMapDto;
import com.ck.quiz.todo.dto.TodoCreateDto;
import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.todo.dto.TodoQueryDto;
import com.ck.quiz.todo.dto.TodoUpdateDto;
import com.ck.quiz.todo.entity.Todo;
import org.springframework.data.domain.Page;

/**
 * 待办管理服务接口
 */
public interface TodoService {

    /**
     * 创建待办
     */
    TodoDto createTodo(TodoCreateDto todoCreateDto);

    /**
     * 更新待办
     */
    TodoDto updateTodo(TodoUpdateDto todoUpdateDto);

    /**
     * 删除待办
     */
    TodoDto deleteTodo(String todoId);

    /**
     * 获取待办详情
     */
    TodoDto getTodoById(String todoId);

    /**
     * 分页查询待办
     */
    Page<TodoDto> searchTodos(TodoQueryDto queryDto);

    /**
     * 实体转DTO
     */
    TodoDto convertToDto(Todo todo);

    MindMapDto initMindMap(String todoId);
}