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
    'baidu_pan',
    'baidu_pan',
    '百度网盘',
    'MENU',
    NULL,
    'baidu-pan',
    'storage',
    31,
    'ENABLED',
    '百度网盘接入壳页面',
    CURRENT_TIMESTAMP,
    'admin',
    CURRENT_TIMESTAMP,
    'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM menu WHERE menu_id = 'baidu_pan' OR menu_name = 'baidu_pan' OR url = 'baidu-pan'
);

INSERT INTO role_menu_rela (rela_id, role_id, menu_id)
SELECT
    'sysmgr_baidu_pan',
    'sys_mgr',
    'baidu_pan'
WHERE EXISTS (SELECT 1 FROM menu WHERE menu_id = 'baidu_pan')
  AND NOT EXISTS (
    SELECT 1 FROM role_menu_rela WHERE role_id = 'sys_mgr' AND menu_id = 'baidu_pan'
  );
