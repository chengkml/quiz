package com.ck.quiz.todo.dto;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.todo.entity.Todo;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class TodoCreateDto extends CreateDto{

    @NotBlank(message = "标题不能为空")
    private String title;

    private String descr;

    private Todo.Status status = Todo.Status.PENDING;

    private Todo.Priority priority = Todo.Priority.MEDIUM;

    private LocalDateTime dueDate;
}