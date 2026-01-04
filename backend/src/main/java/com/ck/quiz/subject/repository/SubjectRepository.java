package com.ck.quiz.subject.repository;

import com.ck.quiz.subject.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, String> {

    List<Subject> findByCreateUser(String userId);

    Subject findByCreateUserAndName(String userId, String subjectName);
}