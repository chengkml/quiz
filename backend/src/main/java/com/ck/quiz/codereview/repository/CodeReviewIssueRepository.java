package com.ck.quiz.codereview.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.codereview.entity.CodeReviewIssue;

public interface CodeReviewIssueRepository extends BaseRepository<CodeReviewIssue> {
    long countByTaskId(String taskId);
}
