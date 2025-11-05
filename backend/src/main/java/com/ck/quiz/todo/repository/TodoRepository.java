package com.ck.quiz.todo.repository;

import com.ck.quiz.todo.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * 待办数据访问接口
 */
@Repository
public interface TodoRepository extends JpaRepository<Todo, String> {

    long countByCreateUserAndStatusIn(String createUser, List<Todo.Status> statuses);
}