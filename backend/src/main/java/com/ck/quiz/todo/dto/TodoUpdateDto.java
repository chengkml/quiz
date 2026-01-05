package com.ck.quiz.todo.dto;

import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.todo.entity.Todo;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class TodoUpdateDto extends UpdateDto{
    @NotBlank(message = "待办ID不能为空")
    private String id;
    private String title;
    private String description;
    private Todo.Status status;
    private Todo.Priority priority;
    private LocalDateTime dueDate;
}