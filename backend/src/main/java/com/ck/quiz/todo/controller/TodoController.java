package com.ck.quiz.todo.controller;

import com.ck.quiz.mindmap.dto.MindMapDto;
import com.ck.quiz.todo.dto.TodoCreateDto;
import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.todo.dto.TodoQueryDto;
import com.ck.quiz.todo.dto.TodoUpdateDto;
import com.ck.quiz.todo.service.TodoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * 待办管理接口
 */
@Tag(name = "待办管理", description = "待办任务的创建、更新、删除、查询等接口")
@RestController
@RequestMapping("/api/todo")
public class TodoController {

    @Autowired
    private TodoService todoService;

    @Operation(summary = "创建待办", description = "创建一个新的待办任务")
    @PostMapping("/create")
    public ResponseEntity<TodoDto> createTodo(
            @Parameter(description = "待办创建信息", required = true)
            @Valid @RequestBody TodoCreateDto dto) {
        return ResponseEntity.ok(todoService.createTodo(dto));
    }

    @Operation(summary = "更新待办", description = "更新指定的待办任务信息")
    @PutMapping("/update")
    public ResponseEntity<TodoDto> updateTodo(
            @Parameter(description = "待办更新信息", required = true)
            @Valid @RequestBody TodoUpdateDto dto) {
        return ResponseEntity.ok(todoService.updateTodo(dto));
    }

    @Operation(summary = "删除待办", description = "根据待办ID删除指定的待办任务")
    @DeleteMapping("/{todoId}")
    public ResponseEntity<Void> deleteTodo(
            @Parameter(description = "待办ID", required = true)
            @PathVariable String todoId) {
        todoService.deleteTodo(todoId);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "获取待办详情", description = "根据ID获取待办任务详细信息")
    @GetMapping("/{todoId}")
    public ResponseEntity<TodoDto> getTodoById(
            @Parameter(description = "待办ID", required = true)
            @PathVariable String todoId) {
        return ResponseEntity.ok(todoService.getTodoById(todoId));
    }

    @Operation(summary = "分页查询待办任务", description = "根据条件分页查询待办任务列表")
    @PostMapping("/search")
    public ResponseEntity<Page<TodoDto>> searchTodos(
            @Parameter(description = "查询条件") @Valid @RequestBody TodoQueryDto queryDto) {
        return ResponseEntity.ok(todoService.searchTodos(queryDto));
    }

    @Operation(summary = "初始化思维导图", description = "根据待办ID初始化思维导图数据")
    @PostMapping("/{todoId}/init-mindmap")
    public ResponseEntity<MindMapDto> initMindMap(
            @Parameter(description = "待办ID", required = true)
            @PathVariable String todoId) {
        return ResponseEntity.ok(todoService.initMindMap(todoId));
    }
}
