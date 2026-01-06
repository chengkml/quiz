package com.ck.quiz.subject.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.subject.entity.Subject;

import java.util.List;

public interface SubjectRepository extends BaseRepository<Subject> {

    List<Subject> findByCreateUser(String userId);

    Subject findByCreateUserAndName(String userId, String subjectName);

    long countByCreateUser(String userId);
}