package com.ck.quiz.tokenusage.service.impl;

import com.ck.quiz.llmmodel.entity.LLMModel;
import com.ck.quiz.llmmodel.repository.LLMModelRepository;
import com.ck.quiz.tokenusage.dto.TokenUsageQueryDto;
import com.ck.quiz.tokenusage.dto.TokenUsageRecordDto;
import com.ck.quiz.tokenusage.dto.TokenUsageStatDto;
import com.ck.quiz.tokenusage.entity.TokenUsage;
import com.ck.quiz.tokenusage.repository.TokenUsageRepository;
import com.ck.quiz.tokenusage.service.TokenUsageService;
import com.ck.quiz.utils.IdHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenUsageServiceImpl implements TokenUsageService {

    private final TokenUsageRepository tokenUsageRepository;
    private final LLMModelRepository llmModelRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    @Transactional
    public void recordUsage(String modelName, String modelProvider, ChatResponseMetadata metadata,
            String businessType, String businessId, String sessionId,
            String requestContent, String responseContent, String userId) {
        if (metadata == null || metadata.getUsage() == null) {
            log.warn("无法记录token使用：metadata或usage为空, modelName={}, businessType={}", modelName, businessType);
            return;
        }

        Usage usage = metadata.getUsage();
        Integer promptTokens = usage.getPromptTokens();
        Integer completionTokens = usage.getCompletionTokens();
        Integer totalTokens = usage.getTotalTokens();

        if (promptTokens == null || completionTokens == null) {
            log.warn("无法记录token使用：token数为空, modelName={}, businessType={}", modelName, businessType);
            return;
        }

        TokenUsage tokenUsage = new TokenUsage();
        tokenUsage.setId(IdHelper.genUuid());
        tokenUsage.setModelName(modelName);
        tokenUsage.setModelProvider(modelProvider);
        tokenUsage.setPromptTokens(promptTokens);
        tokenUsage.setCompletionTokens(completionTokens);
        tokenUsage.setTotalTokens(totalTokens != null ? totalTokens : (promptTokens + completionTokens));
        tokenUsage.setBusinessType(businessType);
        tokenUsage.setBusinessId(businessId);
        tokenUsage.setSessionId(sessionId);
        tokenUsage.setRequestContent(requestContent);
        tokenUsage.setResponseContent(responseContent);
        tokenUsage.setErrorFlag(false);

        // 计算成本
        calculateCost(tokenUsage, modelName);

        tokenUsageRepository.save(tokenUsage);
        log.info("记录token使用成功: modelName={}, businessType={}, promptTokens={}, completionTokens={}, totalCost={}",
                modelName, businessType, promptTokens, completionTokens, tokenUsage.getTotalCost());
    }

    @Override
    @Transactional
    public void recordUsage(String modelName, Integer promptTokens, Integer completionTokens,
            String businessType, String businessId, String sessionId, String userId) {
        if (promptTokens == null || completionTokens == null) {
            log.warn("无法记录token使用：token数为空, modelName={}, businessType={}", modelName, businessType);
            return;
        }

        TokenUsage tokenUsage = new TokenUsage();
        tokenUsage.setId(IdHelper.genUuid());
        tokenUsage.setModelName(modelName);
        tokenUsage.setPromptTokens(promptTokens);
        tokenUsage.setCompletionTokens(completionTokens);
        tokenUsage.setTotalTokens(promptTokens + completionTokens);
        tokenUsage.setBusinessType(businessType);
        tokenUsage.setBusinessId(businessId);
        tokenUsage.setSessionId(sessionId);
        tokenUsage.setErrorFlag(false);

        // 计算成本
        calculateCost(tokenUsage, modelName);

        tokenUsageRepository.save(tokenUsage);
        log.info("记录token使用成功: modelName={}, businessType={}, promptTokens={}, completionTokens={}, totalCost={}",
                modelName, businessType, promptTokens, completionTokens, tokenUsage.getTotalCost());
    }

    @Override
    @Transactional
    public void recordError(String modelName, String businessType, String businessId,
            String sessionId, String errorMessage, String userId) {
        TokenUsage tokenUsage = new TokenUsage();
        tokenUsage.setId(IdHelper.genUuid());
        tokenUsage.setModelName(modelName);
        tokenUsage.setBusinessType(businessType);
        tokenUsage.setBusinessId(businessId);
        tokenUsage.setSessionId(sessionId);
        tokenUsage.setErrorFlag(true);
        tokenUsage.setErrorMessage(errorMessage);
        tokenUsage.setPromptTokens(0);
        tokenUsage.setCompletionTokens(0);
        tokenUsage.setTotalTokens(0);

        tokenUsageRepository.save(tokenUsage);
        log.info("记录token使用错误: modelName={}, businessType={}, error={}", modelName, businessType, errorMessage);
    }

    @Override
    public List<TokenUsageStatDto> queryStatistics(TokenUsageQueryDto queryDto) {
        LocalDateTime startDate = parseDate(queryDto.getStartDate(), true);
        LocalDateTime endDate = parseDate(queryDto.getEndDate(), false);
        String userId = queryDto.getUserId();
        String modelName = queryDto.getModelName();
        String statType = queryDto.getStatType() != null ? queryDto.getStatType() : "model";

        List<Object[]> results;
        switch (statType) {
            case "business":
                results = tokenUsageRepository.statisticsByBusinessType(startDate, endDate, userId);
                break;
            case "user":
                results = tokenUsageRepository.statisticsByUser(startDate, endDate);
                break;
            case "date":
                results = tokenUsageRepository.statisticsByDate(startDate, endDate, userId, modelName);
                break;
            case "model":
            default:
                results = tokenUsageRepository.statisticsByModel(startDate, endDate, userId);
                break;
        }

        return results.stream().map(row -> {
            String dimension = row[0] != null ? row[0].toString() : "未知";
            Long totalTokens = row[1] != null ? ((Number) row[1]).longValue() : 0L;
            Long promptTokens = row[2] != null ? ((Number) row[2]).longValue() : 0L;
            Long completionTokens = row[3] != null ? ((Number) row[3]).longValue() : 0L;
            Double totalCost = row[4] != null ? ((Number) row[4]).doubleValue() : 0.0;
            Long requestCount = row[5] != null ? ((Number) row[5]).longValue() : 0L;

            return new TokenUsageStatDto(dimension, promptTokens, completionTokens,
                    totalTokens, totalCost, requestCount);
        }).collect(Collectors.toList());
    }

    @Override
    public List<TokenUsageRecordDto> queryRecords(TokenUsageQueryDto queryDto) {
        // 简单实现，后续可优化为使用Specification进行复杂查询
        List<TokenUsage> all = tokenUsageRepository.findAll();
        return all.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<TokenUsageRecordDto> queryBySessionId(String sessionId) {
        List<TokenUsage> records = tokenUsageRepository.findBySessionIdOrderByCreateDateAsc(sessionId);
        return records.stream().map(this::toDto).collect(Collectors.toList());
    }

    private void calculateCost(TokenUsage tokenUsage, String modelName) {
        if (!StringUtils.hasText(modelName)) {
            tokenUsage.setInputCost(0.0);
            tokenUsage.setOutputCost(0.0);
            tokenUsage.setTotalCost(0.0);
            return;
        }

        Optional<LLMModel> modelOpt = llmModelRepository.findByName(modelName);
        if (modelOpt.isEmpty()) {
            log.warn("未找到模型配置: {}", modelName);
            tokenUsage.setInputCost(0.0);
            tokenUsage.setOutputCost(0.0);
            tokenUsage.setTotalCost(0.0);
            return;
        }

        LLMModel model = modelOpt.get();
        tokenUsage.setModelProvider(model.getProvider());

        Double inputPricePer1k = model.getInputPricePer1k();
        Double outputPricePer1k = model.getOutputPricePer1k();

        if (inputPricePer1k == null) {
            inputPricePer1k = 0.0;
        }
        if (outputPricePer1k == null) {
            outputPricePer1k = 0.0;
        }

        double inputCost = (tokenUsage.getPromptTokens() / 1000.0) * inputPricePer1k;
        double outputCost = (tokenUsage.getCompletionTokens() / 1000.0) * outputPricePer1k;

        tokenUsage.setInputCost(inputCost);
        tokenUsage.setOutputCost(outputCost);
        tokenUsage.setTotalCost(inputCost + outputCost);
    }

    private LocalDateTime parseDate(String dateStr, boolean isStartOfDay) {
        if (!StringUtils.hasText(dateStr)) {
            return null;
        }
        try {
            LocalDate date = LocalDate.parse(dateStr, DATE_FORMATTER);
            return isStartOfDay ? date.atStartOfDay() : date.atTime(LocalTime.MAX);
        } catch (Exception e) {
            log.warn("日期解析失败: {}", dateStr, e);
            return null;
        }
    }

    private TokenUsageRecordDto toDto(TokenUsage entity) {
        TokenUsageRecordDto dto = new TokenUsageRecordDto();
        dto.setId(entity.getId());
        dto.setModelName(entity.getModelName());
        dto.setModelProvider(entity.getModelProvider());
        dto.setPromptTokens(entity.getPromptTokens());
        dto.setCompletionTokens(entity.getCompletionTokens());
        dto.setTotalTokens(entity.getTotalTokens());
        dto.setInputCost(entity.getInputCost());
        dto.setOutputCost(entity.getOutputCost());
        dto.setTotalCost(entity.getTotalCost());
        dto.setBusinessType(entity.getBusinessType());
        dto.setBusinessId(entity.getBusinessId());
        dto.setSessionId(entity.getSessionId());
        dto.setRequestContent(entity.getRequestContent());
        dto.setResponseContent(entity.getResponseContent());
        dto.setErrorFlag(entity.getErrorFlag());
        dto.setErrorMessage(entity.getErrorMessage());
        dto.setCreateDate(entity.getCreateDate());
        dto.setCreateUser(entity.getCreateUser());
        return dto;
    }
}
