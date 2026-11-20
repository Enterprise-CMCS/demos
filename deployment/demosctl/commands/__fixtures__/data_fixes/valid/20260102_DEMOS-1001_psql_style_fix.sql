-- ticket:        DEMOS-1001
-- author:        Example Author
-- data_owner:    Example Data Owner
-- environments:  prod
-- expected_rows: 1
-- source:        Synthetic public list, retrieved 2026-01-02
-- override:      prevent_changing_example_fields
-- mapping_sha256: 0000000000000000000000000000000000000000000000000000000000000000
-- reverse:       20260102_DEMOS-1001_revert_psql_style_fix.sql
--
-- Synthetic manual fix shaped like DEMOS-2862. It is a runner: psql file, so
-- psql meta-commands, transaction control and DISABLE TRIGGER are allowed.

\set ON_ERROR_STOP on

\if :{?apply}
\else
    \set apply false
\endif

BEGIN;

-- DISABLE TRIGGER holds a lock until commit: keep the timeouts short.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

ALTER TABLE demos_app.example DISABLE TRIGGER prevent_changing_example_fields;

DO $$
BEGIN
    IF (SELECT count(*) FROM demos_app.example WHERE code = 'generated') <> 1 THEN
        RAISE EXCEPTION 'expected 1 generated code';
    END IF;
END
$$;

UPDATE demos_app.example SET code = 'published' WHERE code = 'generated';

ALTER TABLE demos_app.example ENABLE TRIGGER prevent_changing_example_fields;

\if :apply
COMMIT;
\else
ROLLBACK;
\endif
