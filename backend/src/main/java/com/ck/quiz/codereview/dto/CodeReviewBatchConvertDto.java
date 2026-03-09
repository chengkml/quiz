package com.ck.quiz.codereview.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class CodeReviewBatchConvertDto {
    @NotEmpty(message = "问题ID列表不能为空")
    private List<String> issueIds;
}
