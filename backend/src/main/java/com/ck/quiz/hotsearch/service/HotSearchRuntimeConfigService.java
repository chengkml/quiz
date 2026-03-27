package com.ck.quiz.hotsearch.service;

public interface HotSearchRuntimeConfigService {

    RuntimeConfig getConfig();

    class RuntimeConfig {
        private final boolean enabled;
        private final long fixedDelayMs;
        private final String defaultSource;

        public RuntimeConfig(boolean enabled, long fixedDelayMs, String defaultSource) {
            this.enabled = enabled;
            this.fixedDelayMs = fixedDelayMs;
            this.defaultSource = defaultSource;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public long getFixedDelayMs() {
            return fixedDelayMs;
        }

        public String getDefaultSource() {
            return defaultSource;
        }
    }
}
