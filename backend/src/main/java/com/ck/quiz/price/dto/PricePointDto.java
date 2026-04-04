package com.ck.quiz.price.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PricePointDto {
    private LocalDateTime collectedAt;
    private BigDecimal originalPrice;
    private BigDecimal finalPrice;
    private BigDecimal discountAmount;
}
