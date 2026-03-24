package com.ck.quiz.knowledgeset.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VectorSyncCheckSummaryDto {
    private Long totalChunks = 0L;
    private Long totalVectors = 0L;
    private Long totalIssues = 0L;
}
