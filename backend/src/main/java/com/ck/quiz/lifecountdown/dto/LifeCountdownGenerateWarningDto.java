package com.ck.quiz.lifecountdown.dto;

import lombok.Data;

@Data
public class LifeCountdownGenerateWarningDto {

    private Boolean forceRefresh;

    private String modelName;
}
