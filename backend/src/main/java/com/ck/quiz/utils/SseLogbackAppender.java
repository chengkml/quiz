package com.ck.quiz.utils;

import ch.qos.logback.classic.PatternLayout;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.AppenderBase;

public class SseLogbackAppender extends AppenderBase<ILoggingEvent> {

    private LogPushService logPushService;
    private String jobId; // 自定义字段

    private PatternLayout layout; // 用于格式化日志

    public void setJobId(String jobId) {
        this.jobId = jobId;
    }

    public void setLayout(PatternLayout layout) {
        this.layout = layout;
    }

    @Override
    protected void append(ILoggingEvent eventObject) {
        // 只在 jobId 非空时才推送日志
        if (jobId == null || jobId.isEmpty()) {
            return;
        }

        if (logPushService == null) {
            logPushService = SpringContextUtil.getBean(LogPushService.class);
        }
        if (logPushService != null && layout != null) {
            String formatted = layout.doLayout(eventObject);
            logPushService.appendLog(jobId, formatted);
        }
    }
}
