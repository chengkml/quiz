package com.ck.quiz.todo.controller;

import com.ck.quiz.todo.dto.TodoCreateDto;
import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.todo.dto.TodoQueryDto;
import com.ck.quiz.todo.dto.TodoUpdateDto;
import com.ck.quiz.todo.service.TodoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

/**
 * 待办管理接口
 */
@RestController
@RequestMapping("/api/todo")
public class TodoController {

    @Autowired
    private TodoService todoService;

    @PostMapping("/create")
    public TodoDto createTodo(@Validated @RequestBody TodoCreateDto dto) {
        return todoService.createTodo(dto);
    }

    @PostMapping("/update")
    public TodoDto updateTodo(@Validated @RequestBody TodoUpdateDto dto) {
        return todoService.updateTodo(dto);
    }

    @PostMapping("/delete")
    public TodoDto deleteTodo(@RequestParam("todoId") String todoId) {
        return todoService.deleteTodo(todoId);
    }

    @GetMapping("/get")
    public TodoDto getTodoById(@RequestParam("todoId") String todoId) {
        return todoService.getTodoById(todoId);
    }

    @PostMapping("/search")
    public Page<TodoDto> searchTodos(@RequestBody TodoQueryDto queryDto) {
        return todoService.searchTodos(queryDto);
    }
}