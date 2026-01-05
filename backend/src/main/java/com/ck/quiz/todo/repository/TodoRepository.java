package com.ck.quiz.todo.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.todo.entity.Todo;

import java.util.List;

public interface TodoRepository extends BaseRepository<Todo> {

    long countByCreateUserAndStatusIn(String createUser, List<Todo.Status> statuses);
}