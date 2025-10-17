package com.ck.quiz.todo.repository;

import com.ck.quiz.todo.entity.Todo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * 待办数据访问接口
 */
@Repository
public interface TodoRepository extends JpaRepository<Todo, String> {
}