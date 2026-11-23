-- ticket:             DEMOS-2621
-- author:             Dustin Horning
-- data_owner:         Stephanie Hauf
-- environments:       dev, test, impl, prod
-- expected_rows:      0
-- source:             Reverse guard for the DEMOS-2621 submitted deliverable status correction
-- runner:             demosctl
-- requires_migration: 20261113132100_add_budget_neutrality_reporting_tables
-- reverse:            none
-- reverses:           20261123_DEMOS-2621_deliverable_submitted_status_fix.sql
--
-- Automatic reversal is unsafe because the original status of corrected records is not retained.
-- Reversals require a separate, evidence-reviewed data fix.

CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
BEGIN
    RAISE EXCEPTION 'Automatic reversal of DEMOS-2621 is disabled; perform a reviewed manual data fix instead';
END
$$;

INSERT INTO data_fix_result (rows_affected)
VALUES (0);

SELECT rows_affected FROM pg_temp.data_fix_result;
