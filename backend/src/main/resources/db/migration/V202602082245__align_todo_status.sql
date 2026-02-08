-- Align Todo status values with Schedule management
UPDATE todo SET status = 'SCHEDULED' WHERE status = 'PENDING';
