-- Create statistics center menu and migrate existing statistics menu under it.

-- 1) Ensure statistics center directory exists.
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
    'statistics_center',
    'statistics_center',
    '统计中心',
    'DIRECTORY',
    NULL,
    'statistics-center',
    'dashboard',
    20,
    'ENABLED',
    '统计中心',
    CURRENT_TIMESTAMP,
    'admin',
    CURRENT_TIMESTAMP,
    'admin'
WHERE NOT EXISTS (
    SELECT 1
    FROM menu
    WHERE menu_id = 'statistics_center'
       OR menu_name = 'statistics_center'
);

-- 2) Migrate existing statistics menu item to question-bank child route.
UPDATE menu
SET parent_id = 'statistics_center',
    url = 'statistics-center/question-bank',
    menu_label = '题库统计',
    menu_type = 'MENU',
    update_date = CURRENT_TIMESTAMP,
    update_user = 'admin'
WHERE menu_name = 'statistics'
   OR url = 'statistics'
   OR url = 'statistics-center/question-bank';

-- 3) If statistics menu does not exist, create a default child menu.
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
    'statistics',
    'statistics',
    '题库统计',
    'MENU',
    'statistics_center',
    'statistics-center/question-bank',
    'dashboard',
    1,
    'ENABLED',
    '题库统计',
    CURRENT_TIMESTAMP,
    'admin',
    CURRENT_TIMESTAMP,
    'admin'
WHERE NOT EXISTS (
    SELECT 1
    FROM menu
    WHERE menu_name = 'statistics'
       OR url = 'statistics-center/question-bank'
);
