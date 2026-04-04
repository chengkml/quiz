package com.ck.quiz.price.dto;

import com.ck.quiz.base.dto.Dto;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
public class PriceMonitorItemDto extends Dto {
    private String platform;
    private String itemName;
    private String itemUrl;
    private String externalItemId;
    private Boolean monitoringEnabled;
    private String currency;
    private LocalDateTime lastCollectedAt;
    private BigDecimal lastOriginalPrice;
    private String lastDiscountText;
    private BigDecimal lastDiscountAmount;
    private BigDecimal lastFinalPrice;
    private String lastRemark;
}
