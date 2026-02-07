-- 爬虫结果表
CREATE TABLE IF NOT EXISTS crawler_result (
    id VARCHAR(36) PRIMARY KEY,
    crawler_config_id VARCHAR(36) NOT NULL,
    job_id VARCHAR(50),
    url VARCHAR(1000) NOT NULL,
    title VARCHAR(500),
    extracted_data TEXT,
    raw_html TEXT,
    crawl_time TIMESTAMP,
    FOREIGN KEY (crawler_config_id) REFERENCES crawler_config(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_crawler_result_config_id ON crawler_result(crawler_config_id);
CREATE INDEX IF NOT EXISTS idx_crawler_result_job_id ON crawler_result(job_id);
CREATE INDEX IF NOT EXISTS idx_crawler_result_crawl_time ON crawler_result(crawl_time);

COMMENT ON TABLE crawler_result IS '爬虫结果表';
COMMENT ON COLUMN crawler_result.id IS '结果ID';
COMMENT ON COLUMN crawler_result.crawler_config_id IS '爬虫配置ID';
COMMENT ON COLUMN crawler_result.job_id IS '任务ID';
COMMENT ON COLUMN crawler_result.url IS '爬取的URL';
COMMENT ON COLUMN crawler_result.title IS '页面标题';
COMMENT ON COLUMN crawler_result.extracted_data IS '提取的数据,JSON格式';
COMMENT ON COLUMN crawler_result.raw_html IS '原始HTML';
COMMENT ON COLUMN crawler_result.crawl_time IS '爬取时间';
