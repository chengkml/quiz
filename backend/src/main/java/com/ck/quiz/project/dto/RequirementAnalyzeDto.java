package com.ck.quiz.project.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties({"comment", "analysisRemark"})
public class RequirementAnalyzeDto {

    private String descr;

    private Integer progressPercent;
}
