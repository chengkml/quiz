package com.ck.quiz.hotsearch.entity;

import com.ck.quiz.base.entity.Model;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.EqualsAndHashCode;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

@Data
@Entity
@Comment("热搜采集记录")
@EqualsAndHashCode(callSuper = true)
@Table(name = "hot_search_record", indexes = {
        @Index(name = "idx_hot_search_source", columnList = "source"),
        @Index(name = "idx_hot_search_crawl_time", columnList = "crawl_time"),
        @Index(name = "idx_hot_search_batch_no", columnList = "batch_no"),
        @Index(name = "idx_hot_search_source_crawl", columnList = "source, crawl_time")
})
public class HotSearchRecord extends Model {

    @Column(length = 32, nullable = false)
    @Comment("热搜来源")
    private String source;

    @Column(length = 128)
    @Comment("来源外部ID")
    private String externalId;

    @Column(length = 512, nullable = false)
    @Comment("标题")
    private String title;

    @Column(length = 1000)
    @Comment("链接")
    private String url;

    @Column(length = 64)
    @Comment("热度值")
    private String hotValue;

    @Column(name = "rank_index")
    @Comment("排序")
    private Integer rankIndex;

    @Column(name = "crawl_time", nullable = false)
    @Comment("抓取时间")
    private LocalDateTime crawlTime;

    @Column(name = "batch_no", length = 64, nullable = false)
    @Comment("抓取批次")
    private String batchNo;

    @Column(name = "detail_markdown", columnDefinition = "TEXT")
    @Comment("Markdown详情")
    private String detailMarkdown;

    @Column(name = "extra_json", columnDefinition = "TEXT")
    @Comment("扩展字段JSON")
    private String extraJson;
}
