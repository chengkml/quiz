-- 添加日程与待办同步支持
-- 为calendar_event表添加todo_id字段

ALTER TABLE calendar_event ADD COLUMN todo_id VARCHAR(32);

-- 添加索引以提高查询性能
CREATE INDEX idx_calendar_event_todo_id ON calendar_event(todo_id);

-- 如果需要删除location字段（可选）
-- ALTER TABLE calendar_event DROP COLUMN location;
