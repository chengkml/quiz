package com.ck.quiz.crawler.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CrawlerConfigDto {
    private String id;
    private String name;
    private String label;
    private String startUrl;
    private String urlPatterns;
    private String domain;
    private Integer threadCount;
    private Integer retryTimes;
    private Integer sleepTime;
    private Integer timeoutMillis;
    private String charset;
    private String userAgent;
    private String headers;
    private String cookies;
    private String extractRules;
    private String pipelineType;
    private String pipelineConfig;
    private String state;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private String createBy;
    private String updateBy;
    private String remark;
}
