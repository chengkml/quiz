package com.ck.quiz.homework.repository;

import com.ck.quiz.base.repository.BaseRepository;

import com.ck.quiz.homework.entity.Homework;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HomeworkRepository extends BaseRepository<Homework> {
}
