package com.ck.quiz.base.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 复习记录创建 DTO
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class ReviewLogCreateDto extends CreateDto {

    @NotBlank(message = "关联对象ID不能为空")
    private String objId;

    private LocalDateTime reviewDate;

    @NotNull(message = "评分不能为空")
    @Min(value = 0, message = "评分不能小于0")
    @Max(value = 5, message = "评分不能大于5")
    private Integer score;

    @NotNull(message = "复习前简易度因子不能为空")
    private Double efBefore;

    @NotNull(message = "复习后简易度因子不能为空")
    private Double efAfter;

    @NotNull(message = "下次复习间隔天数不能为空")
    private Integer nextIntervalDays;
}
