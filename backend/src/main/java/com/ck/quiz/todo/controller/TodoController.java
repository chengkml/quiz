package com.ck.quiz.todo.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.mindmap.dto.MindMapDto;
import com.ck.quiz.todo.dto.TodoCreateDto;
import com.ck.quiz.todo.dto.TodoDto;
import com.ck.quiz.todo.dto.TodoQueryDto;
import com.ck.quiz.todo.dto.TodoUpdateDto;
import com.ck.quiz.todo.service.TodoService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@Tag(name = "待办管理", description = "待办任务的创建、更新、删除、查询等接口")
@RestController
@RequestMapping("/api/todo")
public class TodoController extends BaseController<TodoCreateDto, TodoUpdateDto, TodoQueryDto, TodoDto> {

    @Autowired
    private TodoService todoService;

    @Operation(summary = "初始化思维导图", description = "根据待办ID初始化思维导图数据")
    @PostMapping("/{todoId}/init-mindmap")
    public ResponseEntity<MindMapDto> initMindMap(
            @Parameter(description = "待办ID", required = true)
            @PathVariable("todoId") String todoId) {
        return ResponseEntity.ok(todoService.initMindMap(todoId));
    }

    @Operation(summary = "完成待办", description = "根据待办ID标记待办为完成")
    @PostMapping("/{id}/complete")
    public ResponseEntity<TodoDto> complete(
            @Parameter(description = "待办ID", required = true)
            @PathVariable("id") String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return ResponseEntity.ok(todoService.complete(authentication.getName(), id));
    }

    @Override
    protected BaseService<TodoCreateDto, TodoUpdateDto, TodoQueryDto, TodoDto, ?> getService() {
        return todoService;
    }
}
