-- Align review_log foreign key column to obj_id (legacy column: vocabulary_card_id)
DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = current_schema()
		  AND table_name = 'review_log'
		  AND column_name = 'vocabulary_card_id'
	) THEN
		IF EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_schema = current_schema()
			  AND table_name = 'review_log'
			  AND column_name = 'obj_id'
		) THEN
			EXECUTE 'UPDATE review_log SET obj_id = COALESCE(obj_id, vocabulary_card_id)';
			EXECUTE 'ALTER TABLE review_log DROP COLUMN vocabulary_card_id';
		ELSE
			EXECUTE 'ALTER TABLE review_log RENAME COLUMN vocabulary_card_id TO obj_id';
		END IF;
	ELSE
		IF NOT EXISTS (
			SELECT 1
			FROM information_schema.columns
			WHERE table_schema = current_schema()
			  AND table_name = 'review_log'
			  AND column_name = 'obj_id'
		) THEN
			EXECUTE 'ALTER TABLE review_log ADD COLUMN obj_id VARCHAR(32)';
		END IF;
	END IF;

	IF NOT EXISTS (
		SELECT 1
		FROM pg_indexes
		WHERE schemaname = current_schema()
		  AND tablename = 'review_log'
		  AND indexname = 'idx_review_obj_id'
	) THEN
		EXECUTE 'CREATE INDEX idx_review_obj_id ON review_log(obj_id)';
	END IF;

	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = current_schema()
		  AND table_name = 'review_log'
		  AND column_name = 'obj_id'
	) THEN
		IF NOT EXISTS (SELECT 1 FROM review_log WHERE obj_id IS NULL) THEN
			EXECUTE 'ALTER TABLE review_log ALTER COLUMN obj_id SET NOT NULL';
		END IF;
	END IF;
END $$;
