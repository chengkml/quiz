package com.ck.quiz.price.service;

import com.ck.quiz.price.dto.PriceSnapshotDto;

import java.util.List;

public interface PriceSnapshotService {
    List<PriceSnapshotDto> listByItem(String userId, String itemId);
}
