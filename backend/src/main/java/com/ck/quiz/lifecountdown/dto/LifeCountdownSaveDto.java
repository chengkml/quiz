package com.ck.quiz.lifecountdown.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class LifeCountdownSaveDto {

    @NotNull(message = "死亡日期不能为空")
    private LocalDate deathDate;
}
