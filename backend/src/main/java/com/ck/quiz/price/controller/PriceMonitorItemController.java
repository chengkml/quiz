package com.ck.quiz.price.controller;

import com.ck.quiz.base.controller.BaseController;
import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.price.dto.ManualPriceCollectRequest;
import com.ck.quiz.price.dto.PriceCollectResultDto;
import com.ck.quiz.price.dto.PriceMonitorItemCreateDto;
import com.ck.quiz.price.dto.PriceMonitorItemDto;
import com.ck.quiz.price.dto.PriceMonitorItemQueryDto;
import com.ck.quiz.price.dto.PriceMonitorItemUpdateDto;
import com.ck.quiz.price.dto.PriceTrendDto;
import com.ck.quiz.price.service.PriceMonitorItemService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/price-monitor/items", "/price-monitor/items"})
public class PriceMonitorItemController extends BaseController<PriceMonitorItemCreateDto, PriceMonitorItemUpdateDto, PriceMonitorItemQueryDto, PriceMonitorItemDto> {

    private final PriceMonitorItemService priceMonitorItemService;

    public PriceMonitorItemController(PriceMonitorItemService priceMonitorItemService) {
        this.priceMonitorItemService = priceMonitorItemService;
    }

    @Override
    protected BaseService<PriceMonitorItemCreateDto, PriceMonitorItemUpdateDto, PriceMonitorItemQueryDto, PriceMonitorItemDto, ?> getService() {
        return priceMonitorItemService;
    }

    @PostMapping("/{id}/collect")
    public PriceCollectResultDto collect(@PathVariable String id, @RequestBody ManualPriceCollectRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return priceMonitorItemService.collect(authentication.getName(), id, request);
    }

    @GetMapping("/{id}/trend")
    public PriceTrendDto trend(@PathVariable String id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return priceMonitorItemService.getTrend(authentication.getName(), id);
    }
}
