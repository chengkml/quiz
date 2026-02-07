package com.ck.quiz.crawler.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Table(name = "crawler_config")
@Data
public class CrawlerConfig {

    @Id
    @Column(length = 36)
    private String id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 200)
    private String label;

    @Column(nullable = false, length = 500)
    private String startUrl;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String urlPatterns;

    @Column(length = 50)
    private String domain;

    @Column(nullable = false)
    private Integer threadCount = 1;

    @Column(nullable = false)
    private Integer retryTimes = 3;

    @Column(nullable = false)
    private Integer sleepTime = 1000;

    @Column(nullable = false)
    private Integer timeoutMillis = 5000;

    @Column(length = 200)
    private String charset = "UTF-8";

    @Column(length = 500)
    private String userAgent;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String headers;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String cookies;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String extractRules;

    @Column(length = 200)
    private String pipelineType;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String pipelineConfig;

    @Column(nullable = false, length = 20)
    private String state = "0"; // 0-停止, 1-启用

    @Column
    private LocalDateTime createTime;

    @Column
    private LocalDateTime updateTime;

    @Column(length = 50)
    private String createBy;

    @Column(length = 50)
    private String updateBy;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String remark;
}
