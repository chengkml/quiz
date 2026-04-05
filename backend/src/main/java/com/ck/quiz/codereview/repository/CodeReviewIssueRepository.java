package com.ck.quiz.codereview.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.codereview.entity.CodeReviewIssue;

import java.util.Optional;

public interface CodeReviewIssueRepository extends BaseRepository<CodeReviewIssue> {
    Optional<CodeReviewIssue> findByIdAndCreateUser(String id, String createUser);

    long countByTaskId(String taskId);
}
