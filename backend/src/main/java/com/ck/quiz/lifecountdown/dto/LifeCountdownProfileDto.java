package com.ck.quiz.lifecountdown.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class LifeCountdownProfileDto extends Dto {

    private LocalDate deathDate;

    private LocalDate todayWarningDate;

    private String todayWarningText;

    private LocalDateTime todayWarningGeneratedAt;

    private String todayWarningModel;
}
