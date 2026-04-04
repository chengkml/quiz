package com.ck.quiz.price.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class PriceSnapshotDto extends Dto {
    private String itemId;
    private String itemName;
    private String platform;
    private LocalDateTime collectedAt;
    private BigDecimal originalPrice;
    private String discountText;
    private BigDecimal discountAmount;
    private BigDecimal finalPrice;
    private String remark;
    private String rawPayload;
}
