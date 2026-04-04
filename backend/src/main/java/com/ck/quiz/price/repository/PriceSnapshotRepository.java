package com.ck.quiz.price.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.price.entity.PriceSnapshot;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PriceSnapshotRepository extends BaseRepository<PriceSnapshot> {
    List<PriceSnapshot> findByItemIdOrderByCollectedAtAsc(String itemId);

    List<PriceSnapshot> findTop2ByItemIdOrderByCollectedAtDesc(String itemId);

    Optional<PriceSnapshot> findTopByItemIdOrderByCollectedAtDesc(String itemId);
}
