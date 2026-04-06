package com.ck.quiz.codereview.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.codereview.dto.CodeReviewIssueCreateDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueQueryDto;
import com.ck.quiz.codereview.dto.CodeReviewIssueUpdateDto;
import com.ck.quiz.codereview.entity.CodeReviewIssue;
import com.ck.quiz.project.dto.RequirementDto;

import java.util.List;

public interface CodeReviewIssueService extends BaseService<CodeReviewIssueCreateDto, CodeReviewIssueUpdateDto, CodeReviewIssueQueryDto, CodeReviewIssueDto, CodeReviewIssue> {

    List<CodeReviewIssueDto> createBatch(List<CodeReviewIssueCreateDto> createDtos);

    RequirementDto convertToRequirement(String userId, String issueId);

    int convertBatchToRequirement(String userId, List<String> issueIds);

    CodeReviewIssueDto revertFromRequirement(String userId, String issueId);

    int revertBatchFromRequirement(String userId, List<String> issueIds);
}
