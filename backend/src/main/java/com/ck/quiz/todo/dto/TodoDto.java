package com.ck.quiz.todo.dto;

import com.ck.quiz.base.dto.Dto;
import com.ck.quiz.todo.entity.Todo;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class TodoDto extends Dto{
    private String id;
    private String title;
    private String description;
    private Todo.Status status;
    private Todo.Priority priority;
    private LocalDateTime dueDate;
    private LocalDateTime createDate;
    private String createUser;
    private String createUserName;
    private LocalDateTime updateDate;
    private String updateUser;
}