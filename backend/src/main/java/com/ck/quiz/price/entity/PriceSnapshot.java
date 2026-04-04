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
@Comment("价格快照")
@EqualsAndHashCode(callSuper = true)
@Table(name = "price_snapshot", indexes = {
        @Index(name = "idx_price_snapshot_item", columnList = "item_id"),
        @Index(name = "idx_price_snapshot_collect_time", columnList = "collected_at"),
        @Index(name = "idx_price_snapshot_user", columnList = "create_user")
})
public class PriceSnapshot extends Model {

    @Column(name = "item_id", length = 32, nullable = false)
    @Comment("监控商品ID")
    private String itemId;

    @Column(nullable = false)
    @Comment("采集时间")
    private LocalDateTime collectedAt;

    @Column(precision = 12, scale = 2)
    @Comment("原价")
    private BigDecimal originalPrice;

    @Column(length = 512)
    @Comment("优惠描述")
    private String discountText;

    @Column(precision = 12, scale = 2)
    @Comment("优惠金额")
    private BigDecimal discountAmount;

    @Column(precision = 12, scale = 2, nullable = false)
    @Comment("最终价")
    private BigDecimal finalPrice;

    @Column(columnDefinition = "TEXT")
    @Comment("备注")
    private String remark;

    @Column(columnDefinition = "TEXT")
    @Comment("原始响应摘要")
    private String rawPayload;
}
