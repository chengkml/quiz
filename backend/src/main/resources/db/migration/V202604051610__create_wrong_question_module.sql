CREATE TABLE IF NOT EXISTS wrong_question (
    id VARCHAR(32) PRIMARY KEY,
    subject_id VARCHAR(32) NOT NULL,
    category_id VARCHAR(32),
    type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    answer TEXT,
    difficulty VARCHAR(20),
    remark TEXT,
    original_image_file_id VARCHAR(32),
    original_image_name VARCHAR(255),
    ocr_text TEXT,
    create_date TIMESTAMP,
    create_user VARCHAR(64),
    update_date TIMESTAMP,
    update_user VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS idx_wrong_question_subject_id ON wrong_question(subject_id);
CREATE INDEX IF NOT EXISTS idx_wrong_question_category_id ON wrong_question(category_id);
CREATE INDEX IF NOT EXISTS idx_wrong_question_type ON wrong_question(type);
CREATE INDEX IF NOT EXISTS idx_wrong_question_create_date ON wrong_question(create_date);

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
    'wrong_question',
    'wrong_question',
    '错题本',
    'MENU',
    NULL,
    'wrong-question',
    'book',
    32,
    'ENABLED',
    '错题本管理页面',
    CURRENT_TIMESTAMP,
    'admin',
    CURRENT_TIMESTAMP,
    'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM menu WHERE menu_id = 'wrong_question' OR menu_name = 'wrong_question' OR url = 'wrong-question'
);

INSERT INTO role_menu_rela (rela_id, role_id, menu_id)
SELECT
    'sysmgr_wrong_question',
    'sys_mgr',
    'wrong_question'
WHERE EXISTS (SELECT 1 FROM menu WHERE menu_id = 'wrong_question')
  AND NOT EXISTS (
    SELECT 1 FROM role_menu_rela WHERE role_id = 'sys_mgr' AND menu_id = 'wrong_question'
  );
