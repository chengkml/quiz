package com.ck.quiz.todo.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.todo.entity.Todo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class TodoQueryDto extends QueryDto {
    private String title;
    private Todo.Status status;
    private Todo.Priority priority;
    private LocalDateTime startTime;
}