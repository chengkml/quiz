package com.ck.quiz.price.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class PriceSnapshotCreateDto {
    private LocalDateTime collectedAt;
    private BigDecimal originalPrice;
    private String discountText;
    private BigDecimal discountAmount;
    private BigDecimal finalPrice;
    private String remark;
    private String rawPayload;
}
