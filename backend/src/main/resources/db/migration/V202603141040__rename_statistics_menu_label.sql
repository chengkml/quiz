-- Rename existing statistics menu display name to "题库统计"
UPDATE menu
SET menu_label = '题库统计'
WHERE url = 'statistics'
   OR menu_name = 'statistics';
