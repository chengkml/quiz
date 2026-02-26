package com.ck.quiz.base.dto;

import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 复习记录查询 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ReviewLogQueryDto extends QueryDto {

    /**
     * 关联对象ID
     */
    private String objId;

    /**
     * 评分最小值
     */
    private Integer minScore;

    /**
     * 评分最大值
     */
    private Integer maxScore;

    /**
     * 复习开始日期
     */
    private LocalDateTime reviewDateStart;

    /**
     * 复习结束日期
     */
    private LocalDateTime reviewDateEnd;

    /**
     * 简易度因子最小值
     */
    private Double minEf;

    /**
     * 简易度因子最大值
     */
    private Double maxEf;
}
