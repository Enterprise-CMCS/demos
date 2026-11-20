-- ticket:        DEMOS-1001
-- author:        Example Author
-- data_owner:    Example Data Owner
-- environments:  prod
-- expected_rows: 1
-- source:        Reverse of the synthetic psql-style fix
-- override:      prevent_changing_example_fields
-- mapping_sha256: 0000000000000000000000000000000000000000000000000000000000000000
-- reverse:       none
-- reverses:      20260102_DEMOS-1001_psql_style_fix.sql

\set ON_ERROR_STOP on

BEGIN;

ALTER TABLE demos_app.example DISABLE TRIGGER prevent_changing_example_fields;

UPDATE demos_app.example SET code = 'generated' WHERE code = 'published';

ALTER TABLE demos_app.example ENABLE TRIGGER prevent_changing_example_fields;

ROLLBACK;
