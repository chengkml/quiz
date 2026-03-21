ALTER TABLE todo
    ADD COLUMN IF NOT EXISTS expire_time TIMESTAMP;

ALTER TABLE calendar_event
    ADD COLUMN IF NOT EXISTS expire_time TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_todo_expire_time ON todo(expire_time);

CREATE INDEX IF NOT EXISTS idx_calendar_event_expire_time ON calendar_event(expire_time);
