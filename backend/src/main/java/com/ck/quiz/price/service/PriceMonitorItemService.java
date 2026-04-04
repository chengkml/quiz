package com.ck.quiz.price.service;

import com.ck.quiz.base.service.BaseService;
import com.ck.quiz.price.dto.PriceCollectResultDto;
import com.ck.quiz.price.dto.PriceMonitorItemCreateDto;
import com.ck.quiz.price.dto.PriceMonitorItemDto;
import com.ck.quiz.price.dto.PriceMonitorItemQueryDto;
import com.ck.quiz.price.dto.PriceMonitorItemUpdateDto;
import com.ck.quiz.price.dto.PriceTrendDto;
import com.ck.quiz.price.dto.ManualPriceCollectRequest;
import com.ck.quiz.price.entity.PriceMonitorItem;

public interface PriceMonitorItemService extends BaseService<PriceMonitorItemCreateDto, PriceMonitorItemUpdateDto, PriceMonitorItemQueryDto, PriceMonitorItemDto, PriceMonitorItem> {
    PriceCollectResultDto collect(String userId, String itemId, ManualPriceCollectRequest request);

    PriceTrendDto getTrend(String userId, String itemId);
}
