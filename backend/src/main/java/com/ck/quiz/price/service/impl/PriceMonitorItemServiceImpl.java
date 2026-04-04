package com.ck.quiz.price.service.impl;

import com.ck.quiz.base.service.impl.BaseServiceImpl;
import com.ck.quiz.notification.service.NotificationService;
import com.ck.quiz.price.dto.ManualPriceCollectRequest;
import com.ck.quiz.price.dto.PriceAlertRuleDto;
import com.ck.quiz.price.dto.PriceCollectResultDto;
import com.ck.quiz.price.dto.PriceMonitorItemCreateDto;
import com.ck.quiz.price.dto.PriceMonitorItemDto;
import com.ck.quiz.price.dto.PriceMonitorItemQueryDto;
import com.ck.quiz.price.dto.PriceMonitorItemUpdateDto;
import com.ck.quiz.price.dto.PricePointDto;
import com.ck.quiz.price.dto.PriceSnapshotDto;
import com.ck.quiz.price.dto.PriceTrendDto;
import com.ck.quiz.price.entity.PriceAlertLog;
import com.ck.quiz.price.entity.PriceAlertRule;
import com.ck.quiz.price.entity.PriceMonitorItem;
import com.ck.quiz.price.entity.PriceSnapshot;
import com.ck.quiz.price.repository.PriceAlertLogRepository;
import com.ck.quiz.price.repository.PriceAlertRuleRepository;
import com.ck.quiz.price.repository.PriceMonitorItemRepository;
import com.ck.quiz.price.repository.PriceSnapshotRepository;
import com.ck.quiz.price.service.PriceMonitorItemService;
import com.ck.quiz.utils.IdHelper;
import com.ck.quiz.utils.JdbcQueryHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
public class PriceMonitorItemServiceImpl extends BaseServiceImpl<PriceMonitorItemCreateDto, PriceMonitorItemUpdateDto, PriceMonitorItemQueryDto, PriceMonitorItemDto, PriceMonitorItem, PriceMonitorItemRepository>
        implements PriceMonitorItemService {

    private final PriceMonitorItemRepository priceMonitorItemRepository;
    private final PriceSnapshotRepository priceSnapshotRepository;
    private final PriceAlertRuleRepository priceAlertRuleRepository;
    private final PriceAlertLogRepository priceAlertLogRepository;
    private final NotificationService notificationService;

    public PriceMonitorItemServiceImpl(PriceMonitorItemRepository priceMonitorItemRepository,
                                       PriceSnapshotRepository priceSnapshotRepository,
                                       PriceAlertRuleRepository priceAlertRuleRepository,
                                       PriceAlertLogRepository priceAlertLogRepository,
                                       NotificationService notificationService) {
        this.priceMonitorItemRepository = priceMonitorItemRepository;
        this.priceSnapshotRepository = priceSnapshotRepository;
        this.priceAlertRuleRepository = priceAlertRuleRepository;
        this.priceAlertLogRepository = priceAlertLogRepository;
        this.notificationService = notificationService;
    }

    @Override
    protected PriceMonitorItemDto newDto() {
        return new PriceMonitorItemDto();
    }

    @Override
    protected PriceMonitorItem newModel() {
        return new PriceMonitorItem();
    }

    @Override
    public PriceMonitorItemDto create(PriceMonitorItemCreateDto createDto) {
        normalizeCreate(createDto);
        return super.create(createDto);
    }

    @Override
    @Transactional
    public PriceMonitorItemDto update(String userId, PriceMonitorItemUpdateDto updateDto) {
        PriceMonitorItem model = getOwnedItem(userId, updateDto.getId());
        model.setPlatform(updateDto.getPlatform());
        model.setItemName(updateDto.getItemName());
        model.setItemUrl(updateDto.getItemUrl());
        model.setExternalItemId(updateDto.getExternalItemId());
        model.setMonitoringEnabled(Boolean.TRUE.equals(updateDto.getMonitoringEnabled()));
        model.setCurrency(StringUtils.hasText(updateDto.getCurrency()) ? updateDto.getCurrency().trim().toUpperCase() : "CNY");
        return convertToDto(priceMonitorItemRepository.save(model), true);
    }

    @Override
    @Transactional(readOnly = true)
    public PriceMonitorItemDto get(String userId, String id) {
        return convertToDto(getOwnedItem(userId, id), true);
    }

    @Override
    @Transactional
    public void delete(String userId, String id) {
        PriceMonitorItem item = getOwnedItem(userId, id);
        priceMonitorItemRepository.delete(item);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PriceMonitorItemDto> list(String userId) {
        return convertToDtos(priceMonitorItemRepository.findByCreateUser(userId));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PriceMonitorItemDto> search(String userId, PriceMonitorItemQueryDto queryDto) {
        StringBuilder sql = new StringBuilder("SELECT p.* FROM price_monitor_item p WHERE p.create_user = :createUser ");
        StringBuilder countSql = new StringBuilder("SELECT COUNT(1) FROM price_monitor_item p WHERE p.create_user = :createUser ");
        Map<String, Object> params = new HashMap<>();
        params.put("createUser", userId);

        JdbcQueryHelper.lowerLike("platformKey", queryDto.getPlatform(), " AND LOWER(p.platform) LIKE :platformKey ", params,
                namedParameterJdbcTemplate, sql, countSql);
        JdbcQueryHelper.lowerLike("itemNameKey", queryDto.getItemName(), " AND LOWER(p.item_name) LIKE :itemNameKey ", params,
                namedParameterJdbcTemplate, sql, countSql);
        if (queryDto.getMonitoringEnabled() != null) {
            sql.append(" AND p.monitoring_enabled = :monitoringEnabled ");
            countSql.append(" AND p.monitoring_enabled = :monitoringEnabled ");
            params.put("monitoringEnabled", queryDto.getMonitoringEnabled());
        }
        JdbcQueryHelper.order("p.create_date", "desc", sql);

        String pageSql = JdbcQueryHelper.getLimitSql(namedParameterJdbcTemplate, sql.toString(), queryDto.getPageNum(), queryDto.getPageSize());
        List<PriceMonitorItemDto> list = namedParameterJdbcTemplate.query(pageSql, params, (rs, rowNum) -> {
            PriceMonitorItem item = new PriceMonitorItem();
            item.setId(rs.getString("id"));
            item.setPlatform(rs.getString("platform"));
            item.setItemName(rs.getString("item_name"));
            item.setItemUrl(rs.getString("item_url"));
            item.setExternalItemId(rs.getString("external_item_id"));
            item.setMonitoringEnabled(rs.getObject("monitoring_enabled") == null ? null : rs.getBoolean("monitoring_enabled"));
            item.setCurrency(rs.getString("currency"));
            item.setLastCollectedAt(toLocalDateTime(rs.getTimestamp("last_collected_at")));
            item.setLastOriginalPrice(rs.getBigDecimal("last_original_price"));
            item.setLastDiscountText(rs.getString("last_discount_text"));
            item.setLastDiscountAmount(rs.getBigDecimal("last_discount_amount"));
            item.setLastFinalPrice(rs.getBigDecimal("last_final_price"));
            item.setLastRemark(rs.getString("last_remark"));
            item.setCreateDate(toLocalDateTime(rs.getTimestamp("create_date")));
            item.setCreateUser(rs.getString("create_user"));
            item.setUpdateDate(toLocalDateTime(rs.getTimestamp("update_date")));
            item.setUpdateUser(rs.getString("update_user"));
            return convertToDto(item, true);
        });
        return JdbcQueryHelper.toPage(namedParameterJdbcTemplate, countSql.toString(), params, list, queryDto.getPageNum(), queryDto.getPageSize());
    }

    @Override
    @Transactional
    public PriceCollectResultDto collect(String userId, String itemId, ManualPriceCollectRequest request) {
        PriceMonitorItem item = getOwnedItem(userId, itemId);
        if (request == null || request.getFinalPrice() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "finalPrice 不能为空");
        }

        PriceSnapshot previousSnapshot = priceSnapshotRepository.findTopByItemIdOrderByCollectedAtDesc(itemId).orElse(null);

        PriceSnapshot snapshot = new PriceSnapshot();
        snapshot.setId(IdHelper.genUuid());
        snapshot.setItemId(itemId);
        snapshot.setCollectedAt(request.getCollectedAt() != null ? request.getCollectedAt() : LocalDateTime.now());
        snapshot.setOriginalPrice(request.getOriginalPrice());
        snapshot.setDiscountText(request.getDiscountText());
        snapshot.setDiscountAmount(request.getDiscountAmount());
        snapshot.setFinalPrice(request.getFinalPrice());
        snapshot.setRemark(request.getRemark());
        snapshot.setRawPayload(request.getRawPayload());
        PriceSnapshot savedSnapshot = priceSnapshotRepository.save(snapshot);

        item.setLastCollectedAt(savedSnapshot.getCollectedAt());
        item.setLastOriginalPrice(savedSnapshot.getOriginalPrice());
        item.setLastDiscountText(savedSnapshot.getDiscountText());
        item.setLastDiscountAmount(savedSnapshot.getDiscountAmount());
        item.setLastFinalPrice(savedSnapshot.getFinalPrice());
        item.setLastRemark(savedSnapshot.getRemark());
        priceMonitorItemRepository.save(item);

        BigDecimal previousFinalPrice = previousSnapshot == null ? null : previousSnapshot.getFinalPrice();
        BigDecimal currentFinalPrice = savedSnapshot.getFinalPrice();
        BigDecimal deltaAmount = null;
        BigDecimal deltaRatio = null;
        if (previousFinalPrice != null && currentFinalPrice != null) {
            deltaAmount = currentFinalPrice.subtract(previousFinalPrice).setScale(2, RoundingMode.HALF_UP);
            if (previousFinalPrice.compareTo(BigDecimal.ZERO) != 0) {
                deltaRatio = deltaAmount.divide(previousFinalPrice, 4, RoundingMode.HALF_UP);
            }
        }

        List<String> triggeredRules = new ArrayList<>();
        String notifyResult = "未触发通知";
        List<PriceAlertRule> rules = priceAlertRuleRepository.findByItemIdAndEnabledTrue(itemId).stream()
                .filter(rule -> Objects.equals(rule.getCreateUser(), userId))
                .toList();

        if (previousFinalPrice != null && !rules.isEmpty()) {
            for (PriceAlertRule rule : rules) {
                String direction = deltaAmount == null ? null : (deltaAmount.signum() >= 0 ? "INCREASE" : "DECREASE");
                boolean directionMatched = ("INCREASE".equals(direction) && Boolean.TRUE.equals(rule.getAlertOnIncrease()))
                        || ("DECREASE".equals(direction) && Boolean.TRUE.equals(rule.getAlertOnDecrease()));
                boolean absoluteMatched = rule.getAbsoluteThreshold() != null && deltaAmount != null
                        && deltaAmount.abs().compareTo(rule.getAbsoluteThreshold()) >= 0;
                boolean ratioMatched = rule.getPercentageThreshold() != null && deltaRatio != null
                        && deltaRatio.abs().compareTo(rule.getPercentageThreshold()) >= 0;
                boolean thresholdMatched = absoluteMatched || ratioMatched;
                if (!directionMatched || !thresholdMatched) {
                    continue;
                }

                String ratioText = deltaRatio == null ? "-" : deltaRatio.multiply(BigDecimal.valueOf(100)).setScale(2, RoundingMode.HALF_UP) + "%";
                String content = "商品价格预警\n"
                        + "商品：" + item.getItemName() + "\n"
                        + "平台：" + item.getPlatform() + "\n"
                        + "方向：" + ("INCREASE".equals(direction) ? "上涨" : "下降") + "\n"
                        + "变动前价格：" + formatMoney(previousFinalPrice, item.getCurrency()) + "\n"
                        + "变动后价格：" + formatMoney(currentFinalPrice, item.getCurrency()) + "\n"
                        + "变动金额：" + formatMoney(deltaAmount, item.getCurrency()) + "\n"
                        + "变动比例：" + ratioText + "\n"
                        + "采集时间：" + savedSnapshot.getCollectedAt() + "\n"
                        + (StringUtils.hasText(item.getItemUrl()) ? "商品链接：" + item.getItemUrl() + "\n" : "");

                try {
                    if ("EMAIL".equalsIgnoreCase(rule.getChannel())) {
                        if (notificationService.sendMessage(userId,
                                "价格预警 - " + item.getItemName(),
                                content,
                                "PRICE_ALERT",
                                "EMAIL") != null) {
                            triggeredRules.add(buildRuleLabel(rule));
                            notifyResult = "已生成邮件通知任务";
                        } else {
                            triggeredRules.add(buildRuleLabel(rule) + "（邮箱缺失，未发送）");
                            notifyResult = "用户邮箱缺失，通知未发送";
                        }
                    }
                } catch (Exception ex) {
                    log.error("发送价格预警失败, itemId={}", itemId, ex);
                    triggeredRules.add(buildRuleLabel(rule) + "（发送失败）");
                    notifyResult = "通知发送失败：" + ex.getMessage();
                }

                PriceAlertLog alertLog = new PriceAlertLog();
                alertLog.setId(IdHelper.genUuid());
                alertLog.setItemId(itemId);
                alertLog.setSnapshotId(savedSnapshot.getId());
                alertLog.setRuleId(rule.getId());
                alertLog.setTriggeredAt(LocalDateTime.now());
                alertLog.setPreviousFinalPrice(previousFinalPrice);
                alertLog.setCurrentFinalPrice(currentFinalPrice);
                alertLog.setDeltaAmount(deltaAmount);
                alertLog.setDeltaRatio(deltaRatio);
                alertLog.setDirection(direction);
                alertLog.setMessageContent(content);
                priceAlertLogRepository.save(alertLog);
            }
        }

        PriceCollectResultDto result = new PriceCollectResultDto();
        result.setItemId(itemId);
        result.setItemName(item.getItemName());
        result.setSnapshot(toSnapshotDto(savedSnapshot, item));
        result.setPreviousFinalPrice(previousFinalPrice);
        result.setCurrentFinalPrice(currentFinalPrice);
        result.setDeltaAmount(deltaAmount);
        result.setDeltaRatio(deltaRatio);
        result.setTriggeredRules(triggeredRules);
        result.setNotifyResult(notifyResult);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public PriceTrendDto getTrend(String userId, String itemId) {
        PriceMonitorItem item = getOwnedItem(userId, itemId);
        List<PricePointDto> points = priceSnapshotRepository.findByItemIdOrderByCollectedAtAsc(itemId).stream()
                .map(snapshot -> new PricePointDto(snapshot.getCollectedAt(), snapshot.getOriginalPrice(), snapshot.getFinalPrice(), snapshot.getDiscountAmount()))
                .toList();
        PriceTrendDto dto = new PriceTrendDto();
        dto.setItemId(item.getId());
        dto.setItemName(item.getItemName());
        dto.setPlatform(item.getPlatform());
        dto.setCurrency(item.getCurrency());
        dto.setPoints(points);
        return dto;
    }

    private void normalizeCreate(PriceMonitorItemCreateDto createDto) {
        if (!StringUtils.hasText(createDto.getPlatform())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "platform 不能为空");
        }
        if (!StringUtils.hasText(createDto.getItemName())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "itemName 不能为空");
        }
        createDto.setPlatform(createDto.getPlatform().trim());
        createDto.setItemName(createDto.getItemName().trim());
        createDto.setMonitoringEnabled(!Boolean.FALSE.equals(createDto.getMonitoringEnabled()));
        createDto.setCurrency(StringUtils.hasText(createDto.getCurrency()) ? createDto.getCurrency().trim().toUpperCase() : "CNY");
    }

    private PriceMonitorItem getOwnedItem(String userId, String id) {
        PriceMonitorItem item = priceMonitorItemRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "价格监控商品不存在"));
        if (!Objects.equals(userId, item.getCreateUser())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "无权访问该价格监控商品");
        }
        return item;
    }

    private PriceSnapshotDto toSnapshotDto(PriceSnapshot snapshot, PriceMonitorItem item) {
        PriceSnapshotDto dto = new PriceSnapshotDto();
        BeanUtils.copyProperties(snapshot, dto);
        dto.setItemName(item.getItemName());
        dto.setPlatform(item.getPlatform());
        return dto;
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private String buildRuleLabel(PriceAlertRule rule) {
        String direction = Boolean.TRUE.equals(rule.getAlertOnIncrease()) && Boolean.TRUE.equals(rule.getAlertOnDecrease())
                ? "涨跌"
                : (Boolean.TRUE.equals(rule.getAlertOnIncrease()) ? "上涨" : "下降");
        return direction + "预警";
    }

    private String formatMoney(BigDecimal value, String currency) {
        if (value == null) {
            return "-";
        }
        return (currency == null ? "" : currency + " ") + value.setScale(2, RoundingMode.HALF_UP);
    }
}
