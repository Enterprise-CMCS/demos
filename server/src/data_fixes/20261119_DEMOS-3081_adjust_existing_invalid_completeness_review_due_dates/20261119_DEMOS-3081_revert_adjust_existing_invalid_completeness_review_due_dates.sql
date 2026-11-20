-- ticket:             DEMOS-3081
-- author:             Connor J. Parke
-- data_owner:         Stephanie Hauf
-- environments:       prod
-- expected_rows:      26
-- source:             Changes in validation rules for completeness review due dates requires updating existing values
-- runner:             demosctl
-- requires_migration: 20260312131729_prisma_init_baseline
-- reverse:            none
-- reverses:           20261119_DEMOS-3081_adjust_existing_invalid_completeness_review_due_dates.sql
--
-- Reverts the adjustment for existing invalid completeness review due dates to comply with updated validation rules

CREATE TEMPORARY TABLE data_fix_result (rows_affected INT) ON COMMIT DROP;

DO $$
DECLARE
    v_rows_affected int;
    v_total_rows int := 0;
BEGIN
    UPDATE demos_app.application_date SET date_value = '2024-12-28 23:59:59.999-05' WHERE application_id = '6b849b75-c9a4-461f-b5e5-be5799f035a5' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2024-12-27 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=6b849b75-c9a4-461f-b5e5-be5799f035a5, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2024-10-12 23:59:59.999-04' WHERE application_id = '35b2d98c-9dd9-44a7-845b-6120236cb3b9' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2024-10-11 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=35b2d98c-9dd9-44a7-845b-6120236cb3b9, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2022-06-18 23:59:59.999-04' WHERE application_id = '526660b0-923f-4d9b-8d52-2fbabcc95a2c' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2022-06-17 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=526660b0-923f-4d9b-8d52-2fbabcc95a2c, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2026-01-31 23:59:59.999-05' WHERE application_id = '9e27d0b2-0734-404e-b824-c7a414be3e38' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2026-01-30 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=9e27d0b2-0734-404e-b824-c7a414be3e38, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2025-06-21 23:59:59.999-04' WHERE application_id = '8432b937-278b-49f7-a511-43b4cd719544' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2025-06-20 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=8432b937-278b-49f7-a511-43b4cd719544, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2024-11-11 23:59:59.999-05' WHERE application_id = '375b5c49-75b3-42ed-af18-aae4bc0dae98' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2024-11-08 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=375b5c49-75b3-42ed-af18-aae4bc0dae98, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2023-11-04 23:59:59.999-04' WHERE application_id = '000c4836-a6ee-4e57-a08c-b2c060143cf7' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2023-11-03 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=000c4836-a6ee-4e57-a08c-b2c060143cf7, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2023-11-04 23:59:59.999-04' WHERE application_id = '3f71b788-8f5c-4af6-a08f-ad450bedbb4a' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2023-11-03 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=3f71b788-8f5c-4af6-a08f-ad450bedbb4a, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2023-01-14 23:59:59.999-05' WHERE application_id = 'c2b810c8-fbf8-4afc-8f50-1e94c5eff0a2' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2023-01-13 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=c2b810c8-fbf8-4afc-8f50-1e94c5eff0a2, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2023-01-14 23:59:59.999-05' WHERE application_id = '94f830f5-7050-41f4-ab45-d26cd3e94a1a' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2023-01-13 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=94f830f5-7050-41f4-ab45-d26cd3e94a1a, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2022-04-23 23:59:59.999-04' WHERE application_id = 'dc34aff4-4f62-499a-a02b-b100413cff5c' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2022-04-22 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=dc34aff4-4f62-499a-a02b-b100413cff5c, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2020-02-15 23:59:59.999-05' WHERE application_id = 'd804c7b8-a4f4-47bd-92b8-c5aa90886a05' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2020-02-14 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=d804c7b8-a4f4-47bd-92b8-c5aa90886a05, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2024-12-07 23:59:59.999-05' WHERE application_id = '22ae612a-eca9-414e-8ba9-9435a8c9a74b' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2024-12-06 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=22ae612a-eca9-414e-8ba9-9435a8c9a74b, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2020-10-31 23:59:59.999-04' WHERE application_id = 'a82b1795-b97f-4181-8e3a-af61b25bd9ae' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2020-10-30 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=a82b1795-b97f-4181-8e3a-af61b25bd9ae, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2019-01-12 23:59:59.999-05' WHERE application_id = '9a90cba7-d7f2-4da1-9716-253b9691ffea' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2019-01-11 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=9a90cba7-d7f2-4da1-9716-253b9691ffea, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2018-08-25 23:59:59.999-04' WHERE application_id = '4a1839d9-07ce-4975-808f-9c021435abf8' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2018-08-24 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=4a1839d9-07ce-4975-808f-9c021435abf8, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2018-12-25 23:59:59.999-05' WHERE application_id = '276b04c5-fc33-467f-8ffe-0c82c20e7575' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2018-12-24 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=276b04c5-fc33-467f-8ffe-0c82c20e7575, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2026-08-29 23:59:59.999-04' WHERE application_id = 'f24384cf-56f2-4ef2-82e2-2e0d805a79f8' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2026-08-28 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=f24384cf-56f2-4ef2-82e2-2e0d805a79f8, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2025-01-04 23:59:59.999-05' WHERE application_id = 'c257b3de-a0ca-4642-bae1-c2059ac0abc0' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2025-01-03 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=c257b3de-a0ca-4642-bae1-c2059ac0abc0, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2020-07-11 23:59:59.999-04' WHERE application_id = '6fb2d503-756c-48fa-82e1-262eb8c7694b' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2020-07-10 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=6fb2d503-756c-48fa-82e1-262eb8c7694b, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2025-10-11 23:59:59.999-04' WHERE application_id = '2f6a0b91-94d0-4951-b1c7-1e346cace4ae' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2025-10-10 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=2f6a0b91-94d0-4951-b1c7-1e346cace4ae, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2025-07-12 23:59:59.999-04' WHERE application_id = '07b29634-c337-412d-bedc-c8afcb71a6cf' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2025-07-11 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=07b29634-c337-412d-bedc-c8afcb71a6cf, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2026-01-01 23:59:59.999-05' WHERE application_id = 'c318427e-7f22-41f1-ac75-cf02ae484e2e' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2025-12-31 23:59:59.999-05';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=c318427e-7f22-41f1-ac75-cf02ae484e2e, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2026-10-10 23:59:59.999-04' WHERE application_id = 'f6d5c893-e594-476b-a907-6b3d0b93af21' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2026-10-09 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=f6d5c893-e594-476b-a907-6b3d0b93af21, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2026-10-17 23:59:59.999-04' WHERE application_id = '106e5c7e-bbed-49bd-a637-cbb1c956d3e5' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2026-10-16 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=106e5c7e-bbed-49bd-a637-cbb1c956d3e5, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;
    UPDATE demos_app.application_date SET date_value = '2026-10-24 23:59:59.999-04' WHERE application_id = 'b214f2f5-1e72-49dd-b209-eccde1fe009b' AND date_type_id = 'Completeness Review Due Date' AND date_value = '2026-10-23 23:59:59.999-04';
    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected != 1 THEN
    RAISE EXCEPTION 'Expected exactly 1 row to be reverted for application_id=b214f2f5-1e72-49dd-b209-eccde1fe009b, but % rows were affected', v_rows_affected;
    END IF;
    v_total_rows := v_total_rows + 1;

    INSERT INTO data_fix_result (rows_affected) VALUES (v_total_rows);
END
$$;

SELECT
    result.rows_affected,
    (
        SELECT count(*) FROM demos_app.application_date
        WHERE
            (
                application_date.application_id = '6b849b75-c9a4-461f-b5e5-be5799f035a5'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2024-12-28 23:59:59.999-05'
            )
            OR (
                application_date.application_id = '35b2d98c-9dd9-44a7-845b-6120236cb3b9'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2024-10-12 23:59:59.999-04'
            )
            OR (
                application_date.application_id = '526660b0-923f-4d9b-8d52-2fbabcc95a2c'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2022-06-18 23:59:59.999-04'
            )
            OR (
                application_date.application_id = '9e27d0b2-0734-404e-b824-c7a414be3e38'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2026-01-31 23:59:59.999-05'
            )
            OR (
                application_date.application_id = '8432b937-278b-49f7-a511-43b4cd719544'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2025-06-21 23:59:59.999-04'
            )
            OR (
                application_date.application_id = '375b5c49-75b3-42ed-af18-aae4bc0dae98'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2024-11-11 23:59:59.999-05'
            )
            OR (
                application_date.application_id = '000c4836-a6ee-4e57-a08c-b2c060143cf7'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2023-11-04 23:59:59.999-04'
            )
            OR (
                application_date.application_id = '3f71b788-8f5c-4af6-a08f-ad450bedbb4a'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2023-11-04 23:59:59.999-04'
            )
            OR (
                application_date.application_id = 'c2b810c8-fbf8-4afc-8f50-1e94c5eff0a2'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2023-01-14 23:59:59.999-05'
            )
            OR (
                application_date.application_id = '94f830f5-7050-41f4-ab45-d26cd3e94a1a'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2023-01-14 23:59:59.999-05'
            )
            OR (
                application_date.application_id = 'dc34aff4-4f62-499a-a02b-b100413cff5c'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2022-04-23 23:59:59.999-04'
            )
            OR (
                application_date.application_id = 'd804c7b8-a4f4-47bd-92b8-c5aa90886a05'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2020-02-15 23:59:59.999-05'
            )
            OR (
                application_date.application_id = '22ae612a-eca9-414e-8ba9-9435a8c9a74b'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2024-12-07 23:59:59.999-05'
            )
            OR (
                application_date.application_id = 'a82b1795-b97f-4181-8e3a-af61b25bd9ae'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2020-10-31 23:59:59.999-04'
            )
            OR (
                application_date.application_id = '9a90cba7-d7f2-4da1-9716-253b9691ffea'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2019-01-12 23:59:59.999-05'
            )
            OR (
                application_date.application_id = '4a1839d9-07ce-4975-808f-9c021435abf8'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2018-08-25 23:59:59.999-04'
            )
            OR (
                application_date.application_id = '276b04c5-fc33-467f-8ffe-0c82c20e7575'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2018-12-25 23:59:59.999-05'
            )
            OR (
                application_date.application_id = 'f24384cf-56f2-4ef2-82e2-2e0d805a79f8'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2026-08-29 23:59:59.999-04'
            )
            OR (
                application_date.application_id = 'c257b3de-a0ca-4642-bae1-c2059ac0abc0'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2025-01-04 23:59:59.999-05'
            )
            OR (
                application_date.application_id = '6fb2d503-756c-48fa-82e1-262eb8c7694b'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2020-07-11 23:59:59.999-04'
            )
            OR (
                application_date.application_id = '2f6a0b91-94d0-4951-b1c7-1e346cace4ae'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2025-10-11 23:59:59.999-04'
            )
            OR (
                application_date.application_id = '07b29634-c337-412d-bedc-c8afcb71a6cf'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2025-07-12 23:59:59.999-04'
            )
            OR (
                application_date.application_id = 'c318427e-7f22-41f1-ac75-cf02ae484e2e'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2026-01-01 23:59:59.999-05'
            )
            OR (
                application_date.application_id = 'f6d5c893-e594-476b-a907-6b3d0b93af21'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2026-10-10 23:59:59.999-04'
            )
            OR (
                application_date.application_id = '106e5c7e-bbed-49bd-a637-cbb1c956d3e5'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2026-10-17 23:59:59.999-04'
            )
            OR (
                application_date.application_id = 'b214f2f5-1e72-49dd-b209-eccde1fe009b'
                AND application_date.date_type_id = 'Completeness Review Due Date'
                AND application_date.date_value = '2026-10-24 23:59:59.999-04'
            )
    ) AS original_dates
FROM pg_temp.data_fix_result AS result;
