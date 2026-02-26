package com.ck.quiz.base.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 复习记录更新 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ReviewLogUpdateDto extends UpdateDto {

    private String objId;

    private LocalDateTime reviewDate;

    @Min(value = 0, message = "评分不能小于0")
    @Max(value = 5, message = "评分不能大于5")
    private Integer score;

    private Double efBefore;

    private Double efAfter;

    private Integer nextIntervalDays;
}
