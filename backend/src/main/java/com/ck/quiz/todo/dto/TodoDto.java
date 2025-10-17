package com.ck.quiz.todo.dto;

import com.ck.quiz.todo.entity.Todo;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 待办信息 DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TodoDto {

    /**
     * 待办唯一标识
     */
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

    /**
     * 创建时间
     */
    private LocalDateTime createDate;

    /**
     * 创建人
     */
    private String createUser;

    /**
     * 创建人中文名
     */
    private String createUserName;

    /**
     * 更新时间
     */
    private LocalDateTime updateDate;

    /**
     * 更新人
     */
    private String updateUser;
}