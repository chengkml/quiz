package com.ck.quiz.price.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class PriceCollectResultDto {
    private String itemId;
    private String itemName;
    private PriceSnapshotDto snapshot;
    private BigDecimal previousFinalPrice;
    private BigDecimal currentFinalPrice;
    private BigDecimal deltaAmount;
    private BigDecimal deltaRatio;
    private List<String> triggeredRules;
    private String notifyResult;
}
