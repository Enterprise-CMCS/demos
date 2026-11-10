-- ticket:             DEMOS-1000
-- author:             Example Author
-- data_owner:         Example Data Owner
-- environments:       dev, test
-- expected_rows:      2
-- source:             Synthetic fixture for the data-fix lint tests
-- runner:             demosctl
-- requires_migration: 20260101000000_example_migration
-- reverse:            20260101_DEMOS-1000_revert_example_fix.sql
--
-- Synthetic example with no real identifiers. The word commit: in this
-- comment, and BEGIN ... END inside the DO block, must not trip lint.

DO $$
BEGIN
    IF (SELECT count(*) FROM demos_app.example WHERE status = 'old') <> 2 THEN
        RAISE EXCEPTION 'expected 2 rows with status old';
    END IF;
END
$$;

CREATE TEMPORARY TABLE data_fix_result (rows_affected int) ON COMMIT DROP;

WITH updated AS (
    UPDATE demos_app.example SET status = 'new' WHERE status = 'old' RETURNING id
)
INSERT INTO data_fix_result (rows_affected) SELECT count(*) FROM updated;

SELECT count(*) AS remaining_old_rows FROM demos_app.example WHERE status = 'old';
