package com.ck.quiz.utils;

import ch.qos.logback.classic.PatternLayout;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;
import org.apache.commons.lang3.StringUtils;

public class SseLogbackAppender extends AppenderBase<ILoggingEvent> {

    private LogPushService logPushService;

    private PatternLayout layout; // 用于格式化日志

    public void setLayout(PatternLayout layout) {
        this.layout = layout;
    }

    @Override
    protected void append(ILoggingEvent eventObject) {
        String jobId = eventObject.getMDCPropertyMap().getOrDefault("jobId", null);
        if (StringUtils.isBlank(jobId)) {
            return;
        }

        if (logPushService == null) {
            logPushService = SpringContextUtil.getBean(LogPushService.class);
        }
        if (layout != null) {
            String formatted = layout.doLayout(eventObject);
            logPushService.appendLog(jobId, formatted);
        }
    }
}
