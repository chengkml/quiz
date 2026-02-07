package com.ck.quiz.tokenusage.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TokenUsageRecordDto {

    private String id;

    private String modelName;

    private String modelProvider;

    private Integer promptTokens;

    private Integer completionTokens;

    private Integer totalTokens;

    private Double inputCost;

    private Double outputCost;

    private Double totalCost;

    private String businessType;

    private String businessId;

    private String sessionId;

    private String requestContent;

    private String responseContent;

    private Boolean errorFlag;

    private String errorMessage;

    private LocalDateTime createDate;

    private String createUser;
}
