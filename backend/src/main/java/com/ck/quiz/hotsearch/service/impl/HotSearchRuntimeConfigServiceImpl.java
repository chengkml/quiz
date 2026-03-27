package com.ck.quiz.hotsearch.service.impl;

import com.ck.quiz.config.entity.SystemParam;
import com.ck.quiz.config.repository.SystemParamRepository;
import com.ck.quiz.hotsearch.service.HotSearchRuntimeConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class HotSearchRuntimeConfigServiceImpl implements HotSearchRuntimeConfigService {

    private final SystemParamRepository systemParamRepository;

    @Value("${quiz.hot-search.enabled:true}")
    private boolean defaultEnabled;

    @Value("${quiz.hot-search.fixed-delay-ms:300000}")
    private long defaultFixedDelayMs;

    @Value("${quiz.hot-search.default-source:TOUTIAO}")
    private String defaultSource;

    public HotSearchRuntimeConfigServiceImpl(SystemParamRepository systemParamRepository) {
        this.systemParamRepository = systemParamRepository;
    }

    @Override
    public RuntimeConfig getConfig() {
        boolean enabled = parseBoolean(read("quiz.hot-search.enabled"), defaultEnabled);
        long fixedDelayMs = parseLong(read("quiz.hot-search.fixed-delay-ms"), defaultFixedDelayMs);
        if (fixedDelayMs < 60_000L) {
            fixedDelayMs = 60_000L;
        }
        String source = read("quiz.hot-search.default-source");
        if (source == null || source.isBlank()) {
            source = defaultSource;
        }
        return new RuntimeConfig(enabled, fixedDelayMs, source.toUpperCase());
    }

    private String read(String key) {
        try {
            SystemParam param = systemParamRepository.findByParamNameAndStatus(key, SystemParam.ParamStatus.ACTIVE);
            return param == null ? null : param.getParamValue();
        } catch (Exception e) {
            log.warn("读取系统参数失败 key={}", key, e);
            return null;
        }
    }

    private boolean parseBoolean(String text, boolean defaultValue) {
        if (text == null || text.isBlank()) {
            return defaultValue;
        }
        return Boolean.parseBoolean(text.trim());
    }

    private long parseLong(String text, long defaultValue) {
        if (text == null || text.isBlank()) {
            return defaultValue;
        }
        try {
            return Long.parseLong(text.trim());
        } catch (Exception e) {
            return defaultValue;
        }
    }
}
