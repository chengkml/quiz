-- Add statistics center child menus for theme pages.

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
    'statistics_vocabulary_proficiency',
    'statistics_vocabulary_proficiency',
    '单词熟练度统计',
    'MENU',
    'statistics_center',
    'statistics-center/vocabulary-proficiency',
    'dashboard',
    2,
    'ENABLED',
    '单词熟练度统计',
    CURRENT_TIMESTAMP,
    'admin',
    CURRENT_TIMESTAMP,
    'admin'
WHERE NOT EXISTS (
    SELECT 1
    FROM menu
    WHERE menu_name = 'statistics_vocabulary_proficiency'
       OR url = 'statistics-center/vocabulary-proficiency'
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
    'statistics_knowledge_mastery',
    'statistics_knowledge_mastery',
    '知识点统计',
    'MENU',
    'statistics_center',
    'statistics-center/knowledge-mastery',
    'dashboard',
    3,
    'ENABLED',
    '知识点统计',
    CURRENT_TIMESTAMP,
    'admin',
    CURRENT_TIMESTAMP,
    'admin'
WHERE NOT EXISTS (
    SELECT 1
    FROM menu
    WHERE menu_name = 'statistics_knowledge_mastery'
       OR url = 'statistics-center/knowledge-mastery'
);
