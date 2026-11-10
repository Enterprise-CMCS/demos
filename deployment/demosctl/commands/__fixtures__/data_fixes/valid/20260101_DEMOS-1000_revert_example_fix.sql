-- ticket:             DEMOS-1000
-- author:             Example Author
-- data_owner:         Example Data Owner
-- environments:       dev, test
-- expected_rows:      2
-- source:             Reverse of the synthetic example fix
-- runner:             demosctl
-- requires_migration: 20260101000000_example_migration
-- reverse:            none
-- reverses:           20260101_DEMOS-1000_example_fix.sql

DO $tag$
BEGIN
    IF (SELECT count(*) FROM demos_app.example WHERE status = 'new') <> 2 THEN
        RAISE EXCEPTION 'expected 2 rows with status new';
    END IF;
END
$tag$;

CREATE TEMP TABLE data_fix_result (rows_affected int) ON COMMIT DROP;

WITH updated AS (
    UPDATE demos_app.example SET status = 'old' WHERE status = 'new' RETURNING id
)
INSERT INTO data_fix_result (rows_affected) SELECT count(*) FROM updated;

SELECT count(*) AS remaining_new_rows FROM demos_app.example WHERE status = 'new';
