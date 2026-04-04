package com.ck.quiz.price.service;

import com.ck.quiz.price.dto.PriceAlertRuleCreateDto;
import com.ck.quiz.price.dto.PriceAlertRuleDto;

import java.util.List;

public interface PriceAlertRuleService {
    List<PriceAlertRuleDto> listByItem(String userId, String itemId);

    PriceAlertRuleDto save(String userId, String itemId, PriceAlertRuleCreateDto dto);
}
