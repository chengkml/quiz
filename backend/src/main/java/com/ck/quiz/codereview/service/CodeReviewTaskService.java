package com.ck.quiz.codereview.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.codereview.dto.CodeReviewTaskCreateDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskHistoryOptionsDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskQueryDto;
import com.ck.quiz.codereview.dto.CodeReviewTaskUpdateDto;
import com.ck.quiz.codereview.entity.CodeReviewTask;

public interface CodeReviewTaskService extends BaseService<CodeReviewTaskCreateDto, CodeReviewTaskUpdateDto, CodeReviewTaskQueryDto, CodeReviewTaskDto, CodeReviewTask> {

    CodeReviewTaskDto start(String userId, String id);

    CodeReviewTaskDto complete(String userId, String id);

    CodeReviewTaskHistoryOptionsDto getHistoryOptions(String userId);
}
