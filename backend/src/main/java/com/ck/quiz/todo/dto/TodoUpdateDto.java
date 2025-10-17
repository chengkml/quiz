package com.ck.quiz.todo.dto;

import com.ck.quiz.todo.entity.Todo;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 待办更新 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TodoUpdateDto {

    /**
     * 待办唯一标识
     */
    @NotBlank(message = "待办ID不能为空")
    private String id;

    /**
     * 标题
     */
    private String title;

    /**
     * 详细描述
     */
    private String description;

    /**
     * 状态
     */
    private Todo.Status status;

    /**
     * 优先级
     */
    private Todo.Priority priority;

    /**
     * 截止时间
     */
    private LocalDateTime dueDate;
}