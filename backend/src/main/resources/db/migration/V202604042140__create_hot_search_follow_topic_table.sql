CREATE TABLE IF NOT EXISTS hot_search_follow_topic (
    id VARCHAR(32) PRIMARY KEY,
    create_date TIMESTAMP,
    create_user VARCHAR(64),
    update_date TIMESTAMP,
    update_user VARCHAR(64),

    topic_name VARCHAR(128) NOT NULL,
    keywords TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    seq INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_hot_search_follow_topic_user ON hot_search_follow_topic(create_user);
CREATE INDEX IF NOT EXISTS idx_hot_search_follow_topic_user_enabled ON hot_search_follow_topic(create_user, enabled);
CREATE INDEX IF NOT EXISTS idx_hot_search_follow_topic_user_seq ON hot_search_follow_topic(create_user, seq);
