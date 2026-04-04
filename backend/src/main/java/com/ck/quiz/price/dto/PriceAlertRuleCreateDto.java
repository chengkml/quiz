package com.ck.quiz.price.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PriceAlertRuleCreateDto {
    private Boolean enabled;
    private Boolean alertOnIncrease;
    private Boolean alertOnDecrease;
    private BigDecimal absoluteThreshold;
    private BigDecimal percentageThreshold;
    private String channel;
}
