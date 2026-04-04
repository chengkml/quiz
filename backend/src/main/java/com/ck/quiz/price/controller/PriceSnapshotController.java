package com.ck.quiz.price.controller;

import com.ck.quiz.price.dto.PriceSnapshotDto;
import com.ck.quiz.price.service.PriceSnapshotService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/price-monitor/items/{itemId}/snapshots")
public class PriceSnapshotController {

    private final PriceSnapshotService priceSnapshotService;

    public PriceSnapshotController(PriceSnapshotService priceSnapshotService) {
        this.priceSnapshotService = priceSnapshotService;
    }

    @GetMapping
    public List<PriceSnapshotDto> list(@PathVariable String itemId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return priceSnapshotService.listByItem(authentication.getName(), itemId);
    }
}
