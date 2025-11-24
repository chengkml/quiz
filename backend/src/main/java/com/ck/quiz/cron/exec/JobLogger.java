package com.ck.quiz.cron.exec;


import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.encoder.PatternLayoutEncoder;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.LoggerContextVO;
import ch.qos.logback.classic.spi.ThrowableProxy;
import com.ck.quiz.utils.LogPushService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.MDC;
import org.slf4j.Marker;
import org.slf4j.event.KeyValuePair;
import org.slf4j.helpers.MessageFormatter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class JobLogger {

    @Lazy
    @Autowired
    private LogPushService sseLogPushService;

    /**
     * SIFT 日志的 PatternLayoutEncoder，用于获取格式化文本
     */
    private static final PatternLayoutEncoder LAYOUT_ENCODER = new PatternLayoutEncoder();

    static {
        LAYOUT_ENCODER.setPattern("%d{yyyy-MM-dd HH:mm:ss} %-5level%msg%n");
        LAYOUT_ENCODER.setContext(((Logger) log).getLoggerContext());
        LAYOUT_ENCODER.start();
    }

    /* ===================== INFO ===================== */
    public void info(String msg) {
        logToAll(Level.INFO, msg, null, null);
    }

    public void info(String format, Object... args) {
        logToAll(Level.INFO, format, null, args);
    }

    public void info(String msg, Throwable t) {
        logToAll(Level.INFO, msg, t, null);
    }

    /* ===================== DEBUG ===================== */
    public void debug(String msg) {
        logToAll(Level.DEBUG, msg, null, null);
    }

    public void debug(String format, Object... args) {
        logToAll(Level.DEBUG, format, null, args);
    }

    public void debug(String msg, Throwable t) {
        logToAll(Level.DEBUG, msg, t, null);
    }

    /* ===================== WARN ===================== */
    public void warn(String msg) {
        logToAll(Level.WARN, msg, null, null);
    }

    public void warn(String format, Object... args) {
        logToAll(Level.WARN, format, null, args);
    }

    public void warn(String msg, Throwable t) {
        logToAll(Level.WARN, msg, t, null);
    }

    /* ===================== ERROR ===================== */
    public void error(String msg) {
        logToAll(Level.ERROR, msg, null, null);
    }

    public void error(String format, Object... args) {
        logToAll(Level.ERROR, format, null, args);
    }

    public void error(String msg, Throwable t) {
        logToAll(Level.ERROR, msg, t, null);
    }

    /* ===================== 内部日志分发方法 ===================== */
    private void logToAll(Level level, String msg, Throwable t, Object[] args) {

        // 输出到全局日志
        if (args != null) log.info(msg, args);
        else if (t != null) log.info(msg, t);
        else log.info(msg);

        // 获取格式化文本并推送 SSE
        try {
            ILoggingEvent event = new ILoggingEventWrapper(level, msg, t, args);
            String formatted = LAYOUT_ENCODER.getLayout().doLayout(event);
            if (event.getMDCPropertyMap() != null) {
                String jobId = event.getMDCPropertyMap().getOrDefault("jobId", null);
                if (StringUtils.isNotBlank(jobId)) {
                    sseLogPushService.appendLog(jobId, formatted);
                }
            }
        } catch (Exception e) {
            log.error("SSE推送日志失败", e);
        }
    }

    private enum Level {INFO, DEBUG, WARN, ERROR}

    /**
     * 简单包装 ILoggingEvent，用于 Layout.doLayout
     */
    private static class ILoggingEventWrapper implements ILoggingEvent {

        private final Level level;
        private final String msg;
        private final Throwable t;
        private final Object[] args;

        public ILoggingEventWrapper(Level level, String msg, Throwable t, Object[] args) {
            this.level = level;
            this.msg = msg;
            this.t = t;
            this.args = args;
        }

        @Override
        public String getThreadName() {
            return Thread.currentThread().getName();
        }

        @Override
        public ch.qos.logback.classic.Level getLevel() {
            switch (level) {
                case INFO:
                    return ch.qos.logback.classic.Level.INFO;
                case DEBUG:
                    return ch.qos.logback.classic.Level.DEBUG;
                case WARN:
                    return ch.qos.logback.classic.Level.WARN;
                case ERROR:
                    return ch.qos.logback.classic.Level.ERROR;
                default:
                    return ch.qos.logback.classic.Level.INFO;
            }
        }

        @Override
        public String getMessage() {
            return msg;
        }

        @Override
        public Object[] getArgumentArray() {
            return args;
        }

        @Override
        public IThrowableProxy getThrowableProxy() {
            return t != null ? new ThrowableProxy(t) : null;
        }

        @Override
        public StackTraceElement[] getCallerData() {
            return new StackTraceElement[0];
        }

        @Override
        public boolean hasCallerData() {
            return false;
        }

        // 其他方法可以返回默认值或 null
        @Override
        public LoggerContextVO getLoggerContextVO() {
            return null;
        }

        @Override
        public String getLoggerName() {
            return "com.asiainfo.synth.cron.exec.JobLogger";
        }

        @Override
        public long getTimeStamp() {
            return System.currentTimeMillis();
        }

        @Override
        public int getNanoseconds() {
            return 0;
        }

        @Override
        public long getSequenceNumber() {
            return 0;
        }

        @Override
        public List<KeyValuePair> getKeyValuePairs() {
            return null;
        }

        @Override
        public Marker getMarker() {
            return null;
        }

        @Override
        public List<Marker> getMarkerList() {
            return null;
        }

        @Override
        public String getFormattedMessage() {
            String formatted = MessageFormatter.arrayFormat(msg, args).getMessage();
            return formatted;
        }

        @Override
        public Map<String, String> getMDCPropertyMap() {
            return MDC.getCopyOfContextMap();
        }

        @Override
        public Map<String, String> getMdc() {
            return MDC.getCopyOfContextMap();
        }

        @Override
        public void prepareForDeferredProcessing() {
        }
    }
}
