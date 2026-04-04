-- 商品价格监控模块：表结构 + 菜单

CREATE TABLE IF NOT EXISTS price_monitor_item (
    id VARCHAR(32) PRIMARY KEY,
    create_date TIMESTAMP NULL,
    create_user VARCHAR(64) NULL,
    update_date TIMESTAMP NULL,
    update_user VARCHAR(64) NULL,
    platform VARCHAR(64) NOT NULL,
    item_name VARCHAR(256) NOT NULL,
    item_url VARCHAR(1024) NULL,
    external_item_id VARCHAR(128) NULL,
    monitoring_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    currency VARCHAR(16) NULL,
    last_collected_at TIMESTAMP NULL,
    last_original_price DECIMAL(12,2) NULL,
    last_discount_text VARCHAR(512) NULL,
    last_discount_amount DECIMAL(12,2) NULL,
    last_final_price DECIMAL(12,2) NULL,
    last_remark TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_monitor_item_user ON price_monitor_item (create_user);
CREATE INDEX IF NOT EXISTS idx_price_monitor_item_platform ON price_monitor_item (platform);
CREATE INDEX IF NOT EXISTS idx_price_monitor_item_enabled ON price_monitor_item (monitoring_enabled);

CREATE TABLE IF NOT EXISTS price_snapshot (
    id VARCHAR(32) PRIMARY KEY,
    create_date TIMESTAMP NULL,
    create_user VARCHAR(64) NULL,
    update_date TIMESTAMP NULL,
    update_user VARCHAR(64) NULL,
    item_id VARCHAR(32) NOT NULL,
    collected_at TIMESTAMP NOT NULL,
    original_price DECIMAL(12,2) NULL,
    discount_text VARCHAR(512) NULL,
    discount_amount DECIMAL(12,2) NULL,
    final_price DECIMAL(12,2) NOT NULL,
    remark TEXT NULL,
    raw_payload TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_snapshot_item ON price_snapshot (item_id);
CREATE INDEX IF NOT EXISTS idx_price_snapshot_collect_time ON price_snapshot (collected_at);
CREATE INDEX IF NOT EXISTS idx_price_snapshot_user ON price_snapshot (create_user);

CREATE TABLE IF NOT EXISTS price_alert_rule (
    id VARCHAR(32) PRIMARY KEY,
    create_date TIMESTAMP NULL,
    create_user VARCHAR(64) NULL,
    update_date TIMESTAMP NULL,
    update_user VARCHAR(64) NULL,
    item_id VARCHAR(32) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    alert_on_increase BOOLEAN NOT NULL DEFAULT FALSE,
    alert_on_decrease BOOLEAN NOT NULL DEFAULT TRUE,
    absolute_threshold DECIMAL(12,2) NULL,
    percentage_threshold DECIMAL(8,4) NULL,
    channel VARCHAR(32) NOT NULL DEFAULT 'EMAIL'
);

CREATE INDEX IF NOT EXISTS idx_price_alert_rule_item ON price_alert_rule (item_id);
CREATE INDEX IF NOT EXISTS idx_price_alert_rule_enabled ON price_alert_rule (enabled);

CREATE TABLE IF NOT EXISTS price_alert_log (
    id VARCHAR(32) PRIMARY KEY,
    create_date TIMESTAMP NULL,
    create_user VARCHAR(64) NULL,
    update_date TIMESTAMP NULL,
    update_user VARCHAR(64) NULL,
    item_id VARCHAR(32) NOT NULL,
    snapshot_id VARCHAR(32) NOT NULL,
    rule_id VARCHAR(32) NULL,
    triggered_at TIMESTAMP NOT NULL,
    previous_final_price DECIMAL(12,2) NULL,
    current_final_price DECIMAL(12,2) NULL,
    delta_amount DECIMAL(12,2) NULL,
    delta_ratio DECIMAL(8,4) NULL,
    direction VARCHAR(32) NULL,
    message_content TEXT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_alert_log_item ON price_alert_log (item_id);
CREATE INDEX IF NOT EXISTS idx_price_alert_log_snapshot ON price_alert_log (snapshot_id);
CREATE INDEX IF NOT EXISTS idx_price_alert_log_triggered ON price_alert_log (triggered_at);

INSERT INTO menu (
    menu_id,
    menu_name,
    menu_label,
    menu_type,
    parent_id,
    url,
    menu_icon,
    seq,
    state,
    menu_descr,
    create_date,
    create_user,
    update_date,
    update_user
)
SELECT
    'price_monitor',
    'price_monitor',
    '价格监控',
    'MENU',
    NULL,
    'price-monitor',
    'dashboard',
    30,
    'ENABLED',
    '商品价格监控',
    CURRENT_TIMESTAMP,
    'admin',
    CURRENT_TIMESTAMP,
    'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM menu WHERE menu_id = 'price_monitor' OR menu_name = 'price_monitor' OR url = 'price-monitor'
);

INSERT INTO role_menu_rela (rela_id, role_id, menu_id)
SELECT
    'sysmgr_price_monitor',
    'sys_mgr',
    'price_monitor'
WHERE EXISTS (SELECT 1 FROM menu WHERE menu_id = 'price_monitor')
  AND NOT EXISTS (
    SELECT 1 FROM role_menu_rela WHERE role_id = 'sys_mgr' AND menu_id = 'price_monitor'
  );
