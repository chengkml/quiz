package com.ck.quiz.price.service.impl;

import com.ck.quiz.price.dto.PriceAlertRuleCreateDto;
import com.ck.quiz.price.dto.PriceAlertRuleDto;
import com.ck.quiz.price.entity.PriceAlertRule;
import com.ck.quiz.price.entity.PriceMonitorItem;
import com.ck.quiz.price.repository.PriceAlertRuleRepository;
import com.ck.quiz.price.repository.PriceMonitorItemRepository;
import com.ck.quiz.price.service.PriceAlertRuleService;
import com.ck.quiz.utils.IdHelper;
import org.springframework.beans.BeanUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@Service
public class PriceAlertRuleServiceImpl implements PriceAlertRuleService {

    private final PriceAlertRuleRepository priceAlertRuleRepository;
    private final PriceMonitorItemRepository priceMonitorItemRepository;

    public PriceAlertRuleServiceImpl(PriceAlertRuleRepository priceAlertRuleRepository,
                                     PriceMonitorItemRepository priceMonitorItemRepository) {
        this.priceAlertRuleRepository = priceAlertRuleRepository;
        this.priceMonitorItemRepository = priceMonitorItemRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PriceAlertRuleDto> listByItem(String userId, String itemId) {
        ensureItemOwnership(userId, itemId);
        return priceAlertRuleRepository.findByItemId(itemId).stream()
                .filter(rule -> Objects.equals(userId, rule.getCreateUser()))
                .map(this::toDto)
                .toList();
    }

    @Override
    @Transactional
    public PriceAlertRuleDto save(String userId, String itemId, PriceAlertRuleCreateDto dto) {
        ensureItemOwnership(userId, itemId);
        List<PriceAlertRule> existingRules = priceAlertRuleRepository.findByItemId(itemId).stream()
                .filter(rule -> Objects.equals(userId, rule.getCreateUser()))
                .toList();
        PriceAlertRule rule = existingRules.isEmpty() ? new PriceAlertRule() : existingRules.get(0);
        if (rule.getId() == null) {
            rule.setId(IdHelper.genUuid());
            rule.setItemId(itemId);
        }
        rule.setEnabled(!Boolean.FALSE.equals(dto.getEnabled()));
        rule.setAlertOnIncrease(Boolean.TRUE.equals(dto.getAlertOnIncrease()));
        rule.setAlertOnDecrease(!Boolean.FALSE.equals(dto.getAlertOnDecrease()));
        rule.setAbsoluteThreshold(dto.getAbsoluteThreshold());
        rule.setPercentageThreshold(dto.getPercentageThreshold());
        rule.setChannel(StringUtils.hasText(dto.getChannel()) ? dto.getChannel().trim().toUpperCase() : "EMAIL");
        return toDto(priceAlertRuleRepository.save(rule));
    }

    private void ensureItemOwnership(String userId, String itemId) {
        PriceMonitorItem item = priceMonitorItemRepository.findById(itemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "价格监控商品不存在"));
        if (!Objects.equals(userId, item.getCreateUser())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无权访问该价格监控商品");
        }
    }

    private PriceAlertRuleDto toDto(PriceAlertRule rule) {
        PriceAlertRuleDto dto = new PriceAlertRuleDto();
        BeanUtils.copyProperties(rule, dto);
        return dto;
    }
}
