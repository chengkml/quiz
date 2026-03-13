package com.ck.quiz.project.dto;

import lombok.Data;

@Data
public class RequirementReviewDto {

    private String descr;

    private String comment;

    private ReviewDecision decision;

    public enum ReviewDecision {
        TO_OPEN,
        TO_REVISION
    }
}
