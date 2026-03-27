package com.ck.quiz.hotsearch.schedule;

import com.ck.quiz.hotsearch.service.HotSearchRuntimeConfigService;
import com.ck.quiz.hotsearch.service.HotSearchService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class HotSearchScheduler {

    private final HotSearchService hotSearchService;
    private final HotSearchRuntimeConfigService runtimeConfigService;

    private volatile long lastRunAt = 0L;

    public HotSearchScheduler(HotSearchService hotSearchService,
                              HotSearchRuntimeConfigService runtimeConfigService) {
        this.hotSearchService = hotSearchService;
        this.runtimeConfigService = runtimeConfigService;
    }

    @Scheduled(fixedDelayString = "${quiz.hot-search.schedule-tick-ms:60000}",
            initialDelayString = "${quiz.hot-search.initial-delay-ms:30000}")
    public void scheduledCollect() {
        HotSearchRuntimeConfigService.RuntimeConfig config = runtimeConfigService.getConfig();
        if (!config.isEnabled()) {
            return;
        }

        long now = System.currentTimeMillis();
        if (now - lastRunAt < config.getFixedDelayMs()) {
            return;
        }

        try {
            hotSearchService.collectLatest(config.getDefaultSource());
            lastRunAt = now;
        } catch (Exception e) {
            log.error("定时抓取热搜失败 source={}", config.getDefaultSource(), e);
        }
    }
}
