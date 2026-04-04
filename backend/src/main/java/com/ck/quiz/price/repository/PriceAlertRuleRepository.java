package com.ck.quiz.price.repository;

import com.ck.quiz.base.repository.BaseRepository;
import com.ck.quiz.price.entity.PriceAlertRule;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PriceAlertRuleRepository extends BaseRepository<PriceAlertRule> {
    List<PriceAlertRule> findByItemId(String itemId);

    List<PriceAlertRule> findByItemIdAndEnabledTrue(String itemId);
}
