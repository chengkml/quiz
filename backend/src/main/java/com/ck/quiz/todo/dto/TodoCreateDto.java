package com.ck.quiz.todo.dto;

import com.ck.quiz.todo.entity.Todo;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 待办创建 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TodoCreateDto {

    /**
     * 标题
     */
    @NotBlank(message = "标题不能为空")
    private String title;

    /**
     * 详细描述
     */
    private String description;

    /**
     * 状态（可选，默认PENDING）
     */
    private Todo.Status status = Todo.Status.PENDING;

    /**
     * 优先级（可选，默认MEDIUM）
     */
    private Todo.Priority priority = Todo.Priority.MEDIUM;

    /**
     * 截止时间（可选）
     */
    private LocalDateTime dueDate;
}