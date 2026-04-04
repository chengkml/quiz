package com.ck.quiz.price.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import java.math.BigDecimal;

@Data
@Entity
@Comment("价格预警规则")
@EqualsAndHashCode(callSuper = true)
@Table(name = "price_alert_rule", indexes = {
        @Index(name = "idx_price_alert_rule_item", columnList = "item_id"),
        @Index(name = "idx_price_alert_rule_enabled", columnList = "enabled")
})
public class PriceAlertRule extends Model {

    @Column(name = "item_id", length = 32, nullable = false)
    @Comment("监控商品ID")
    private String itemId;

    @Column(nullable = false)
    @Comment("是否启用")
    private Boolean enabled = Boolean.TRUE;

    @Column(nullable = false)
    @Comment("是否上涨预警")
    private Boolean alertOnIncrease = Boolean.FALSE;

    @Column(nullable = false)
    @Comment("是否下降预警")
    private Boolean alertOnDecrease = Boolean.TRUE;

    @Column(precision = 12, scale = 2)
    @Comment("绝对值阈值")
    private BigDecimal absoluteThreshold;

    @Column(precision = 8, scale = 4)
    @Comment("比例阈值，如 0.1000 表示 10%")
    private BigDecimal percentageThreshold;

    @Column(length = 32, nullable = false)
    @Comment("通知方式")
    private String channel = "EMAIL";
}
