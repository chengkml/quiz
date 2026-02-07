-- 爬虫配置表
CREATE TABLE IF NOT EXISTS crawler_config (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    label VARCHAR(200),
    start_url VARCHAR(500) NOT NULL,
    url_patterns TEXT,
    domain VARCHAR(50),
    thread_count INT NOT NULL DEFAULT 1,
    retry_times INT NOT NULL DEFAULT 3,
    sleep_time INT NOT NULL DEFAULT 1000,
    timeout_millis INT NOT NULL DEFAULT 5000,
    charset VARCHAR(200) DEFAULT 'UTF-8',
    user_agent VARCHAR(500),
    headers TEXT,
    cookies TEXT,
    extract_rules TEXT,
    pipeline_type VARCHAR(200),
    pipeline_config TEXT,
    state VARCHAR(20) NOT NULL DEFAULT '0',
    create_time TIMESTAMP,
    update_time TIMESTAMP,
    create_by VARCHAR(50),
    update_by VARCHAR(50),
    remark TEXT
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_crawler_config_state ON crawler_config(state);
CREATE INDEX IF NOT EXISTS idx_crawler_config_name ON crawler_config(name);

COMMENT ON TABLE crawler_config IS '爬虫配置表';
COMMENT ON COLUMN crawler_config.id IS '爬虫配置ID';
COMMENT ON COLUMN crawler_config.name IS '爬虫名称';
COMMENT ON COLUMN crawler_config.label IS '爬虫标签';
COMMENT ON COLUMN crawler_config.start_url IS '起始URL';
COMMENT ON COLUMN crawler_config.url_patterns IS 'URL正则匹配模式,JSON数组';
COMMENT ON COLUMN crawler_config.domain IS '爬取域名';
COMMENT ON COLUMN crawler_config.thread_count IS '线程数';
COMMENT ON COLUMN crawler_config.retry_times IS '重试次数';
COMMENT ON COLUMN crawler_config.sleep_time IS '请求间隔时间(毫秒)';
COMMENT ON COLUMN crawler_config.timeout_millis IS '超时时间(毫秒)';
COMMENT ON COLUMN crawler_config.charset IS '字符集';
COMMENT ON COLUMN crawler_config.user_agent IS 'User-Agent';
COMMENT ON COLUMN crawler_config.headers IS '请求头,JSON格式';
COMMENT ON COLUMN crawler_config.cookies IS 'Cookies,JSON格式';
COMMENT ON COLUMN crawler_config.extract_rules IS '数据提取规则,JSON格式';
COMMENT ON COLUMN crawler_config.pipeline_type IS '数据处理管道类型';
COMMENT ON COLUMN crawler_config.pipeline_config IS '数据处理管道配置,JSON格式';
COMMENT ON COLUMN crawler_config.state IS '状态:0-停止,1-启用';
COMMENT ON COLUMN crawler_config.create_time IS '创建时间';
COMMENT ON COLUMN crawler_config.update_time IS '更新时间';
COMMENT ON COLUMN crawler_config.create_by IS '创建人';
COMMENT ON COLUMN crawler_config.update_by IS '更新人';
COMMENT ON COLUMN crawler_config.remark IS '备注';
