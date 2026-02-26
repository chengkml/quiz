package com.ck.quiz.base.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 复习记录 DTO（通用）
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ReviewLogDto extends Dto {
    private String objId;
    private LocalDateTime reviewDate;
    private Integer score;
    private Double efBefore;
    private Double efAfter;
    private Integer nextIntervalDays;
}
