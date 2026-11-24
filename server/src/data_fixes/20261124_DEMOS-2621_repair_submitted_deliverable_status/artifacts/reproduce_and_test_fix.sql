\set ON_ERROR_STOP on
\if :{?DEMOS2621_CONFIRM_LOCAL_FIXTURE}
\else
\echo 'Refusing to run fixture. Pass -v DEMOS2621_CONFIRM_LOCAL_FIXTURE=1 to confirm this is a disposable local database.'
\quit
\endif

BEGIN;

DO $$
BEGIN
    IF current_user <> 'postgres' OR current_database() <> 'demos' THEN
        RAISE EXCEPTION 'Fixture requires the local demos database connected as postgres';
    END IF;

    IF to_regclass('legacy_pmda_raw.mdcd_dlvrbl_stus_rfrnc') IS NOT NULL
       OR to_regclass('legacy_pmda_raw.mdcd_dlvrbl') IS NOT NULL
       OR to_regclass('legacy_pmda_staged.final_demos_app_deliverable') IS NOT NULL THEN
        RAISE EXCEPTION 'Fixture requires a local database without PMDA source tables';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM demos_app.deliverable
        WHERE id IN (
            '24caae00-f70e-4db2-bf33-a5debe808f75',
            '8cde9f59-5dbc-4429-afb3-82ede6f996be',
            '67a59a82-927d-457e-83ea-db1121bcb9ac',
            '8c8c9519-a6ee-4cbd-b06c-f99b1ce09a48',
            'c52cc9c3-e62c-4f6d-ab93-9f2d5cbeed56',
            '64264347-4e51-49ff-a62e-69ebb7adac14',
            'ab7c69f2-6579-4107-9bc2-c0668a3274de',
            '63cd18c5-ed66-4552-95f2-d5e2bb83fdbd',
            '8d470218-f71d-4951-ac2e-21e82a7f5dab',
            '4c91d6e8-9fd1-4bd0-9fcc-ffa847991f10',
            'a5da8164-c2eb-4169-ab2c-924e2be4b38f',
            '5f6e32d9-26b1-458a-b8d3-7a117259ec0a',
            '47ab06d7-c5f1-44db-b7b2-4bd3b2d8e808',
            'd04b46d6-1272-41ae-ac71-974788465ebf'
        )
    ) THEN
        RAISE EXCEPTION 'Fixture UUIDs already exist; refusing to overwrite local records';
    END IF;
END
$$;

CREATE SCHEMA IF NOT EXISTS legacy_pmda_raw;
CREATE SCHEMA IF NOT EXISTS legacy_pmda_staged;

CREATE TABLE legacy_pmda_raw.mdcd_dlvrbl_stus_rfrnc (
    mdcd_dlvrbl_stus_cd INTEGER PRIMARY KEY,
    mdcd_dlvrbl_stus_name VARCHAR(100) NOT NULL,
    dsply_sqnc_num SMALLINT,
    creatd_dt DATE
);

CREATE TABLE legacy_pmda_raw.mdcd_dlvrbl (
    mdcd_dlvrbl_id INTEGER PRIMARY KEY,
    mdcd_dlvrbl_crnt_stus_cd INTEGER NOT NULL
);

CREATE TABLE legacy_pmda_staged.final_demos_app_deliverable (
    id UUID PRIMARY KEY,
    _legacy_mdcd_dlvrbl_id INTEGER NOT NULL
);

INSERT INTO legacy_pmda_raw.mdcd_dlvrbl_stus_rfrnc (
    mdcd_dlvrbl_stus_cd,
    mdcd_dlvrbl_stus_name
) VALUES (4, 'Requested Resubmission');

CREATE TEMPORARY TABLE fixture_targets (
    deliverable_id UUID PRIMARY KEY,
    pmda_deliverable_id INTEGER UNIQUE NOT NULL
) ON COMMIT DROP;

INSERT INTO fixture_targets (deliverable_id, pmda_deliverable_id) VALUES
    ('24caae00-f70e-4db2-bf33-a5debe808f75', 900001),
    ('8cde9f59-5dbc-4429-afb3-82ede6f996be', 900002),
    ('67a59a82-927d-457e-83ea-db1121bcb9ac', 900003),
    ('8c8c9519-a6ee-4cbd-b06c-f99b1ce09a48', 900004),
    ('c52cc9c3-e62c-4f6d-ab93-9f2d5cbeed56', 900005),
    ('64264347-4e51-49ff-a62e-69ebb7adac14', 900006),
    ('ab7c69f2-6579-4107-9bc2-c0668a3274de', 900007),
    ('63cd18c5-ed66-4552-95f2-d5e2bb83fdbd', 900008),
    ('8d470218-f71d-4951-ac2e-21e82a7f5dab', 900009),
    ('4c91d6e8-9fd1-4bd0-9fcc-ffa847991f10', 900010),
    ('a5da8164-c2eb-4169-ab2c-924e2be4b38f', 900011),
    ('5f6e32d9-26b1-458a-b8d3-7a117259ec0a', 900012),
    ('47ab06d7-c5f1-44db-b7b2-4bd3b2d8e808', 900013),
    ('d04b46d6-1272-41ae-ac71-974788465ebf', 900014);

INSERT INTO demos_app.deliverable (
    id,
    deliverable_type_id,
    name,
    demonstration_id,
    demonstration_status_id,
    status_id,
    cms_owner_user_id,
    cms_owner_person_type_id,
    due_date,
    due_date_type_id,
    expected_to_be_submitted,
    created_at,
    updated_at
)
SELECT
    fixture.deliverable_id,
    donor.deliverable_type_id,
    'DEMOS-2621 local fixture ' || fixture.pmda_deliverable_id,
    donor.demonstration_id,
    donor.demonstration_status_id,
    'Past Due',
    donor.cms_owner_user_id,
    donor.cms_owner_person_type_id,
    '2020-01-01 23:59:59.999+00'::timestamptz,
    donor.due_date_type_id,
    donor.expected_to_be_submitted,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM fixture_targets AS fixture
CROSS JOIN LATERAL (
    SELECT *
    FROM demos_app.deliverable
    WHERE id = '503c85c4-e7d1-4b98-b62e-b56e85bef21e'
) AS donor;

INSERT INTO legacy_pmda_raw.mdcd_dlvrbl (
    mdcd_dlvrbl_id,
    mdcd_dlvrbl_crnt_stus_cd
)
SELECT pmda_deliverable_id, 4
FROM fixture_targets;

INSERT INTO legacy_pmda_staged.final_demos_app_deliverable (
    id,
    _legacy_mdcd_dlvrbl_id
)
SELECT deliverable_id, pmda_deliverable_id
FROM fixture_targets;

INSERT INTO demos_app.deliverable_action (
    id,
    action_timestamp,
    deliverable_id,
    action_type_id,
    old_status_id,
    new_status_id,
    note,
    due_date_change_allowed,
    should_have_note,
    should_have_user_id,
    extension_id_optional,
    old_due_date,
    new_due_date,
    user_id
)
SELECT
    gen_random_uuid(),
    '2025-01-01 12:00:00+00'::timestamptz,
    fixture.deliverable_id,
    'Submitted Deliverable',
    'Submitted',
    'Submitted',
    NULL,
    FALSE,
    FALSE,
    TRUE,
    TRUE,
    '2020-01-01 23:59:59.999+00'::timestamptz,
    '2020-01-01 23:59:59.999+00'::timestamptz,
    source_action.user_id
FROM fixture_targets AS fixture
CROSS JOIN LATERAL (
    SELECT user_id
    FROM demos_app.deliverable_action
    WHERE deliverable_id = '503c85c4-e7d1-4b98-b62e-b56e85bef21e'
      AND action_type_id = 'Submitted Deliverable'
    ORDER BY action_timestamp DESC
    LIMIT 1
) AS source_action;

INSERT INTO demos_app.deliverable_action (
    id,
    action_timestamp,
    deliverable_id,
    action_type_id,
    old_status_id,
    new_status_id,
    note,
    due_date_change_allowed,
    should_have_note,
    should_have_user_id,
    extension_id_optional,
    old_due_date,
    new_due_date,
    user_id
)
SELECT
    gen_random_uuid(),
    '2026-08-14 19:34:48+00'::timestamptz,
    fixture.deliverable_id,
    'Migrated Deliverable From PMDA',
    'Upcoming',
    'Upcoming',
    NULL,
    FALSE,
    FALSE,
    FALSE,
    TRUE,
    '2020-01-01 23:59:59.999+00'::timestamptz,
    '2020-01-01 23:59:59.999+00'::timestamptz,
    NULL
FROM fixture_targets AS fixture;

INSERT INTO demos_app.deliverable_action (
    id,
    action_timestamp,
    deliverable_id,
    action_type_id,
    old_status_id,
    new_status_id,
    note,
    due_date_change_allowed,
    should_have_note,
    should_have_user_id,
    extension_id_optional,
    old_due_date,
    new_due_date,
    user_id
)
SELECT
    gen_random_uuid(),
    '2026-08-14 20:25:49+00'::timestamptz,
    fixture.deliverable_id,
    'Marked as Past Due',
    'Upcoming',
    'Past Due',
    NULL,
    FALSE,
    FALSE,
    FALSE,
    TRUE,
    '2020-01-01 23:59:59.999+00'::timestamptz,
    '2020-01-01 23:59:59.999+00'::timestamptz,
    NULL
FROM fixture_targets AS fixture;

\ir ../20261124_DEMOS-2621_repair_submitted_deliverable_status.sql

DO $$
DECLARE
    v_submitted_count INTEGER;
    v_past_due_count INTEGER;
BEGIN
    SELECT count(*)
    INTO v_submitted_count
    FROM demos_app.deliverable AS d
    JOIN fixture_targets AS fixture ON fixture.deliverable_id = d.id
    WHERE d.status_id = 'Submitted';

    SELECT count(*)
    INTO v_past_due_count
    FROM demos_app.deliverable AS d
    JOIN fixture_targets AS fixture ON fixture.deliverable_id = d.id
    WHERE d.status_id = 'Past Due';

    IF v_submitted_count != 14 OR v_past_due_count != 0 THEN
        RAISE EXCEPTION 'Expected 14 Submitted and 0 Past Due fixture records; got % Submitted and % Past Due',
            v_submitted_count, v_past_due_count;
    END IF;

    RAISE NOTICE 'DEMOS-2621 fixture passed: all 14 Past Due records corrected to Submitted';
END
$$;

ROLLBACK;
