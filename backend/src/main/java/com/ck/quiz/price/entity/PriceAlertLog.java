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
import java.time.LocalDateTime;

@Data
@Entity
@Comment("价格预警发送日志")
@EqualsAndHashCode(callSuper = true)
@Table(name = "price_alert_log", indexes = {
        @Index(name = "idx_price_alert_log_item", columnList = "item_id"),
        @Index(name = "idx_price_alert_log_snapshot", columnList = "snapshot_id"),
        @Index(name = "idx_price_alert_log_triggered", columnList = "triggered_at")
})
public class PriceAlertLog extends Model {

    @Column(name = "item_id", length = 32, nullable = false)
    @Comment("监控商品ID")
    private String itemId;

    @Column(name = "snapshot_id", length = 32, nullable = false)
    @Comment("触发快照ID")
    private String snapshotId;

    @Column(name = "rule_id", length = 32)
    @Comment("规则ID")
    private String ruleId;

    @Column(nullable = false)
    @Comment("触发时间")
    private LocalDateTime triggeredAt;

    @Column(precision = 12, scale = 2)
    @Comment("前值")
    private BigDecimal previousFinalPrice;

    @Column(precision = 12, scale = 2)
    @Comment("当前值")
    private BigDecimal currentFinalPrice;

    @Column(precision = 12, scale = 2)
    @Comment("差值")
    private BigDecimal deltaAmount;

    @Column(precision = 8, scale = 4)
    @Comment("差值比例")
    private BigDecimal deltaRatio;

    @Column(length = 32)
    @Comment("方向")
    private String direction;

    @Column(columnDefinition = "TEXT")
    @Comment("消息内容")
    private String messageContent;
}
