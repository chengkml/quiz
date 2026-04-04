package com.ck.quiz.price.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
public class PriceAlertRuleDto extends Dto {
    private String itemId;
    private Boolean enabled;
    private Boolean alertOnIncrease;
    private Boolean alertOnDecrease;
    private BigDecimal absoluteThreshold;
    private BigDecimal percentageThreshold;
    private String channel;
}
