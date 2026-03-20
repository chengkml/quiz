ALTER TABLE knowledge_source
    ALTER COLUMN content TYPE VARCHAR(2048);

ALTER TABLE knowledge_chunk
    ALTER COLUMN meta TYPE VARCHAR(2048);
