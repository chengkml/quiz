package com.ck.quiz.todo.dto;

import com.ck.quiz.base.dto.QueryDto;
import com.ck.quiz.todo.entity.Todo;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
public class TodoQueryDto extends QueryDto{
    private String title;
    private Todo.Status status;
    private Todo.Priority priority;
    private Integer pageNum = 0;
    private Integer pageSize = 20;
    private String sortColumn = "create_date";
    private String sortType = "desc";
}