package com.ck.quiz.todo.dto;

import com.ck.quiz.base.dto.UpdateDto;
import com.ck.quiz.todo.entity.Todo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class TodoUpdateDto extends UpdateDto {
    private String title;
    private String descr;
    private Todo.Status status;
    private Todo.Priority priority;
    private LocalDateTime startTime;

    private LocalDateTime dueDate;

    private LocalDateTime expireTime;
}
