package com.ck.quiz.baidupan.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BaiduPanAuthStatusDto {
    private boolean configured;
    private boolean bound;
    private boolean mockMode;
    private String providerName;
    private String accountName;
    private String message;
    private String authTip;
    private String callbackPath;
    private String authorizeUrl;
    private String configRoute;
    private String configCategory;
    private LocalDateTime boundAt;
    private List<String> requiredConfigKeys;
    private List<String> missingConfigKeys;
}
