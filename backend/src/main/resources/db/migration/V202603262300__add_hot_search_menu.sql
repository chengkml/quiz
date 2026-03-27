-- 新增热搜展示菜单（统计中心下）
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
    'hot_search',
    'hot_search',
    '热搜展示',
    'MENU',
    'statistics_center',
    'hot-search',
    'dashboard',
    10,
    'ENABLED',
    '热搜展示',
    CURRENT_TIMESTAMP,
    'admin',
    CURRENT_TIMESTAMP,
    'admin'
WHERE NOT EXISTS (
    SELECT 1
    FROM menu
    WHERE menu_id = 'hot_search'
       OR menu_name = 'hot_search'
       OR url = 'hot-search'
);

-- 为系统管理员角色补充菜单权限
INSERT INTO role_menu_rela (rela_id, role_id, menu_id)
SELECT
    'sysmgr_hot_search',
    'sys_mgr',
    'hot_search'
WHERE EXISTS (SELECT 1 FROM menu WHERE menu_id = 'hot_search')
  AND NOT EXISTS (
    SELECT 1 FROM role_menu_rela WHERE role_id = 'sys_mgr' AND menu_id = 'hot_search'
  );
