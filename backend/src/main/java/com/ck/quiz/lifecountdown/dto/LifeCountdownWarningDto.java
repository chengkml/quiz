package com.ck.quiz.lifecountdown.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class LifeCountdownWarningDto {

    private String warningText;

    private LocalDate warningDate;

    private LocalDateTime generatedAt;

    private String modelName;

    private Boolean cached;
}
