package com.ck.quiz.codereview.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.codereview.entity.CodeReviewTask;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CodeReviewTaskRepository extends BaseRepository<CodeReviewTask> {

    List<CodeReviewTask> findTop200ByCreateUserOrderByCreateDateDesc(String createUser);
}
