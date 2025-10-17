package com.ck.quiz.todo.dto;

import com.ck.quiz.todo.entity.Todo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 待办查询 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TodoQueryDto {

    /**
     * 标题关键字（模糊）
     */
    private String title;

    /**
     * 状态
     */
    private Todo.Status status;

    /**
     * 优先级
     */
    private Todo.Priority priority;

    /**
     * 创建人
     */
    private String createUser;

    /**
     * 当前页码，从0开始
     */
    private Integer pageNum = 0;

    /**
     * 每页显示条数
     */
    private Integer pageSize = 20;

    /**
     * 排序字段
     */
    private String sortColumn = "createDate";

    /**
     * 排序方式，asc 或 desc
     */
    private String sortType = "desc";
}