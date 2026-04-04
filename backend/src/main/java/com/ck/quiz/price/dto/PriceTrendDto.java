package com.ck.quiz.price.dto;

import lombok.Data;

import java.util.List;

@Data
public class PriceTrendDto {
    private String itemId;
    private String itemName;
    private String platform;
    private String currency;
    private List<PricePointDto> points;
}
