-- 为系统消息功能添加菜单项

-- 插入系统消息菜单项（如果不存在）
INSERT INTO menu (menu_id, parent_id, menu_name, menu_order, menu_url, menu_type, status, create_date, update_date)
SELECT 
    UUID() as menu_id,
    NULL as parent_id,
    '系统消息' as menu_name,
    99 as menu_order,
    'systemmessage' as menu_url,
    'MENU' as menu_type,
    'ACTIVE' as status,
    NOW() as create_date,
    NOW() as update_date
WHERE NOT EXISTS (
    SELECT 1 FROM menu WHERE menu_url = 'systemmessage'
);
