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
@Comment("价格监控商品")
@EqualsAndHashCode(callSuper = true)
@Table(name = "price_monitor_item", indexes = {
        @Index(name = "idx_price_monitor_item_user", columnList = "create_user"),
        @Index(name = "idx_price_monitor_item_platform", columnList = "platform"),
        @Index(name = "idx_price_monitor_item_enabled", columnList = "monitoring_enabled")
})
public class PriceMonitorItem extends Model {

    @Column(length = 64, nullable = false)
    @Comment("平台")
    private String platform;

    @Column(length = 256, nullable = false)
    @Comment("商品名称")
    private String itemName;

    @Column(length = 1024)
    @Comment("商品链接")
    private String itemUrl;

    @Column(length = 128)
    @Comment("商品标识/SKU")
    private String externalItemId;

    @Column(nullable = false)
    @Comment("是否启用监控")
    private Boolean monitoringEnabled = Boolean.TRUE;

    @Column(length = 16)
    @Comment("币种")
    private String currency = "CNY";

    @Column
    @Comment("最近采集时间")
    private LocalDateTime lastCollectedAt;

    @Column(precision = 12, scale = 2)
    @Comment("最近原价")
    private BigDecimal lastOriginalPrice;

    @Column(length = 512)
    @Comment("最近优惠描述")
    private String lastDiscountText;

    @Column(precision = 12, scale = 2)
    @Comment("最近优惠金额")
    private BigDecimal lastDiscountAmount;

    @Column(precision = 12, scale = 2)
    @Comment("最近最终价")
    private BigDecimal lastFinalPrice;

    @Column(columnDefinition = "TEXT")
    @Comment("最近备注")
    private String lastRemark;
}
