package com.ck.quiz.todo.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mindmap.dto.MindMapDto;
import com.ck.quiz.todo.dto.TodoCreateDto;
import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.todo.dto.TodoQueryDto;
import com.ck.quiz.todo.dto.TodoUpdateDto;
import com.ck.quiz.todo.entity.Todo;

public interface TodoService extends BaseService<TodoCreateDto, TodoUpdateDto, TodoQueryDto, TodoDto, Todo> {

    MindMapDto initMindMap(String todoId);

    TodoDto complete(String userId, String id);
}