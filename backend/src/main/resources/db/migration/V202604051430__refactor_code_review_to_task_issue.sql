CREATE TABLE IF NOT EXISTS code_review_task (
    id VARCHAR(32) PRIMARY KEY,
    create_date TIMESTAMP NULL,
    create_user VARCHAR(64) NULL,
    update_date TIMESTAMP NULL,
    update_user VARCHAR(64) NULL,
    title VARCHAR(256) NOT NULL,
    project_name VARCHAR(128) NULL,
    git_url VARCHAR(512) NULL,
    branch VARCHAR(128) NULL DEFAULT 'main',
    target_page VARCHAR(256) NOT NULL,
    review_standard VARCHAR(64) NOT NULL DEFAULT 'DUOWENSPEC',
    descr TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN'
);

CREATE INDEX IF NOT EXISTS idx_crt_project ON code_review_task(project_name);
CREATE INDEX IF NOT EXISTS idx_crt_status ON code_review_task(status);
CREATE INDEX IF NOT EXISTS idx_crt_target_page ON code_review_task(target_page);
CREATE INDEX IF NOT EXISTS idx_crt_create_user ON code_review_task(create_user);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = current_schema()
          AND table_name = 'code_review_issue'
          AND column_name = 'task_id'
    ) THEN
        EXECUTE 'ALTER TABLE code_review_issue ADD COLUMN task_id VARCHAR(32)';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_cri_task_id ON code_review_issue(task_id);
