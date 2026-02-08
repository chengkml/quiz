package com.ck.quiz.todo.dto;

import com.ck.quiz.base.dto.CreateDto;
import com.ck.quiz.todo.entity.Todo;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class TodoCreateDto extends CreateDto {

    @NotBlank(message = "标题不能为空")
    private String title;

    private String descr;

    private Todo.Status status = Todo.Status.SCHEDULED;

    private Todo.Priority priority = Todo.Priority.MEDIUM;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime startTime;

    private LocalDateTime dueDate;
}