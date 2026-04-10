-- 生命倒计时模块：用户唯一配置 + 今日警示语模板 + 菜单

CREATE TABLE IF NOT EXISTS life_countdown_profile (
    id VARCHAR(32) PRIMARY KEY,
    create_date TIMESTAMP NULL,
    create_user VARCHAR(64) NULL,
    update_date TIMESTAMP NULL,
    update_user VARCHAR(64) NULL,
    death_date DATE NULL,
    today_warning_date DATE NULL,
    today_warning_text TEXT NULL,
    today_warning_generated_at TIMESTAMP NULL,
    today_warning_model VARCHAR(128) NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uk_life_countdown_profile_user ON life_countdown_profile (create_user);
CREATE INDEX IF NOT EXISTS idx_life_countdown_profile_death_date ON life_countdown_profile (death_date);

INSERT INTO prompt_templates (id, name, content, description, create_date, create_user)
SELECT REPLACE(UUID(), '-', ''),
       'lifeCountdownWarningGenerate',
       '你是一个克制、清醒、负责的生命倒计时提醒助手。请基于用户设定的死亡日期，生成 1 句中文今日警示语。要求：1. 只输出一句话，不要标题、解释、序号、引号、emoji。2. 语气要冷静、简短、有行动导向，可以刺痛，但不能鼓励自伤、绝望、暴力或攻击。3. 控制在 18 到 40 个汉字之间。4. 结合当前时间、死亡日期和剩余天数，不要简单复述输入。当前时间：{{currentDateTime}}；死亡日期：{{deathDate}}；剩余天数：{{remainingDays}}。',
       'Generate one short daily warning sentence for life countdown.',
       NOW(),
       'system'
WHERE NOT EXISTS (
    SELECT 1 FROM prompt_templates WHERE name = 'lifeCountdownWarningGenerate'
);

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
    'life_countdown',
    'life_countdown',
    '生命倒计时',
    'MENU',
    NULL,
    'life-countdown',
    'home',
    33,
    'ENABLED',
    '生命倒计时与今日警示语',
    CURRENT_TIMESTAMP,
    'admin',
    CURRENT_TIMESTAMP,
    'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM menu WHERE menu_id = 'life_countdown' OR menu_name = 'life_countdown' OR url = 'life-countdown'
);

INSERT INTO role_menu_rela (rela_id, role_id, menu_id)
SELECT
    'sysmgr_life_countdown',
    'sys_mgr',
    'life_countdown'
WHERE EXISTS (SELECT 1 FROM menu WHERE menu_id = 'life_countdown')
  AND NOT EXISTS (
    SELECT 1 FROM role_menu_rela WHERE role_id = 'sys_mgr' AND menu_id = 'life_countdown'
  );
