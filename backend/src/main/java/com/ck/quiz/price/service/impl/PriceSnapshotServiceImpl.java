package com.ck.quiz.price.service.impl;

import com.ck.quiz.price.dto.PriceSnapshotDto;
import com.ck.quiz.price.entity.PriceMonitorItem;
import com.ck.quiz.price.repository.PriceMonitorItemRepository;
import com.ck.quiz.price.repository.PriceSnapshotRepository;
import com.ck.quiz.price.service.PriceSnapshotService;
import org.springframework.beans.BeanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
public class PriceSnapshotServiceImpl implements PriceSnapshotService {

    private final PriceSnapshotRepository priceSnapshotRepository;
    private final PriceMonitorItemRepository priceMonitorItemRepository;

    public PriceSnapshotServiceImpl(PriceSnapshotRepository priceSnapshotRepository,
                                    PriceMonitorItemRepository priceMonitorItemRepository) {
        this.priceSnapshotRepository = priceSnapshotRepository;
        this.priceMonitorItemRepository = priceMonitorItemRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PriceSnapshotDto> listByItem(String userId, String itemId) {
        PriceMonitorItem item = priceMonitorItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "价格监控商品不存在"));
        if (!Objects.equals(userId, item.getCreateUser())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无权访问该价格监控商品");
        }
        return priceSnapshotRepository.findByItemIdOrderByCollectedAtAsc(itemId).stream().map(snapshot -> {
            PriceSnapshotDto dto = new PriceSnapshotDto();
            BeanUtils.copyProperties(snapshot, dto);
            dto.setItemName(item.getItemName());
            dto.setPlatform(item.getPlatform());
            return dto;
        }).toList();
    }
}
