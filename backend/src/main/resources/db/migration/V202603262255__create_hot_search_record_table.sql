CREATE TABLE IF NOT EXISTS hot_search_record (
    id VARCHAR(32) PRIMARY KEY,
    create_date TIMESTAMP,
    create_user VARCHAR(64),
    update_date TIMESTAMP,
    update_user VARCHAR(64),

    source VARCHAR(32) NOT NULL,
    external_id VARCHAR(128),
    title VARCHAR(512) NOT NULL,
    url VARCHAR(1000),
    hot_value VARCHAR(64),
    rank_index INTEGER,
    crawl_time TIMESTAMP NOT NULL,
    batch_no VARCHAR(64) NOT NULL,
    detail_markdown TEXT,
    extra_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_hot_search_source ON hot_search_record(source);
CREATE INDEX IF NOT EXISTS idx_hot_search_crawl_time ON hot_search_record(crawl_time);
CREATE INDEX IF NOT EXISTS idx_hot_search_batch_no ON hot_search_record(batch_no);
CREATE INDEX IF NOT EXISTS idx_hot_search_source_crawl ON hot_search_record(source, crawl_time);
