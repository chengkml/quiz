package com.ck.quiz.price.controller;

import com.ck.quiz.price.dto.PriceAlertRuleCreateDto;
import com.ck.quiz.price.dto.PriceAlertRuleDto;
import com.ck.quiz.price.service.PriceAlertRuleService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/price-monitor/items/{itemId}/alert-rules")
public class PriceAlertRuleController {

    private final PriceAlertRuleService priceAlertRuleService;

    public PriceAlertRuleController(PriceAlertRuleService priceAlertRuleService) {
        this.priceAlertRuleService = priceAlertRuleService;
    }

    @GetMapping
    public List<PriceAlertRuleDto> list(@PathVariable String itemId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return priceAlertRuleService.listByItem(authentication.getName(), itemId);
    }

    @PostMapping
    public PriceAlertRuleDto save(@PathVariable String itemId, @RequestBody PriceAlertRuleCreateDto dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return priceAlertRuleService.save(authentication.getName(), itemId, dto);
    }
}
