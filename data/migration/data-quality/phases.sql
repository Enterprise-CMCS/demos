-- Testing a variety of data quality items
--   Do all applications have 8 phases?
--   Are all phases complete for all approved applications?
--   Do all completed phases have completion dates?
--   Do any phases have completion dates without being completed?
--   Do all skipped phases have skip dates?
--   Do any phases have skip dates without being skipped?

WITH app_phases_and_dates AS (
    SELECT
        ap.application_id,
        ap.phase_id,
        ap.phase_status_id,
        date_complete.date_value AS completed_date,
        date_skipped.date_value AS skipped_date
    FROM
        demos_app.application_phase AS ap
    LEFT JOIN
        demos_app.application_date AS date_complete
        ON
            ap.application_id = date_complete.application_id AND (
                (ap.phase_id = 'Concept' AND date_complete.date_type_id = 'Concept Completion Date')
                OR (
                    ap.phase_id = 'Application Intake'
                    AND date_complete.date_type_id = 'Application Intake Completion Date'
                )
                OR (ap.phase_id = 'Completeness' AND date_complete.date_type_id = 'Completeness Completion Date')
                OR (ap.phase_id = 'Federal Comment' AND date_complete.date_type_id = 'Federal Comment Period End Date')
                OR (ap.phase_id = 'SDG Preparation' AND date_complete.date_type_id = 'SDG Preparation Completion Date')
                OR (ap.phase_id = 'Review' AND date_complete.date_type_id = 'Review Completion Date')
                OR (
                    ap.phase_id = 'Approval Package' AND date_complete.date_type_id = 'Approval Package Completion Date'
                )
                OR (
                    ap.phase_id = 'Approval Summary' AND date_complete.date_type_id = 'Approval Summary Completion Date'
                )
            )
    LEFT JOIN
        demos_app.application_date AS date_skipped
        ON
            ap.application_id = date_skipped.application_id
            AND (ap.phase_id = 'Concept' AND date_skipped.date_type_id = 'Concept Skipped Date')
),

app_phase_aggregates AS (
    SELECT
        app.id AS application_id,
        app.application_type_id,
        coalesce(demo.status_id, amend.status_id, extend.status_id) AS status_id,
        count(*) AS n_phases,
        sum(CASE WHEN apd.phase_status_id = 'Completed' THEN 1 ELSE 0 END) AS n_complete_phases,
        sum(CASE WHEN apd.phase_status_id = 'Skipped' THEN 1 ELSE 0 END) AS n_skipped_phases,
        sum(CASE WHEN apd.phase_status_id = 'Completed' AND apd.completed_date IS NOT NULL THEN 1 ELSE 0 END)
            AS n_phases_marked_complete_with_date,
        sum(CASE WHEN apd.phase_status_id = 'Completed' AND apd.completed_date IS NULL THEN 1 ELSE 0 END)
            AS n_phases_marked_completed_without_date,
        sum(CASE WHEN apd.phase_status_id != 'Completed' AND apd.completed_date IS NOT NULL THEN 1 ELSE 0 END)
            AS n_phases_not_marked_completed_with_completed_date,
        sum(CASE WHEN apd.phase_status_id = 'Skipped' AND apd.skipped_date IS NOT NULL THEN 1 ELSE 0 END)
            AS n_phases_marked_skipped_with_date,
        sum(CASE WHEN apd.phase_status_id = 'Skipped' AND apd.skipped_date IS NULL THEN 1 ELSE 0 END)
            AS n_phases_marked_skipped_without_date,
        sum(CASE WHEN apd.phase_status_id != 'Skipped' AND apd.skipped_date IS NOT NULL THEN 1 ELSE 0 END)
            AS n_phases_not_marked_skipped_with_skipped_date
    FROM
        demos_app.application AS app
    LEFT JOIN
        app_phases_and_dates AS apd
        ON
            app.id = apd.application_id
    LEFT JOIN
        demos_app.demonstration AS demo
        ON
            app.id = demo.id
    LEFT JOIN
        demos_app.amendment AS amend
        ON
            app.id = amend.id
    LEFT JOIN
        demos_app.extension AS extend
        ON
            app.id = extend.id
    GROUP BY
        app.id, app.application_type_id, coalesce(demo.status_id, amend.status_id, extend.status_id)
),

logic_tests AS (
    SELECT
        application_id,
        application_type_id,
        CASE WHEN n_phases = 8 THEN 'PASS' ELSE 'FAIL' END AS has_all_phases,
        CASE
            WHEN status_id != 'Approved' THEN 'N/A'
            WHEN status_id = 'Approved' AND (n_complete_phases + n_skipped_phases) = 8 THEN 'PASS' ELSE 'FAIL' END
            AS is_approved_and_has_all_phases_completed_or_skipped,
        CASE
            WHEN n_complete_phases = 0 THEN 'N/A'
            WHEN n_complete_phases = n_phases_marked_complete_with_date THEN 'PASS'
            ELSE 'FAIL'
        END AS all_complete_phases_have_completion_date,
        CASE
            WHEN n_phases_not_marked_completed_with_completed_date = 0 THEN 'PASS'
            ELSE 'FAIL'
        END AS completion_dates_exist_only_for_completed_phases,
        CASE
            WHEN n_skipped_phases = 0 THEN 'N/A'
            WHEN n_skipped_phases = n_phases_marked_skipped_with_date THEN 'PASS'
            ELSE 'FAIL'
        END AS all_skipped_phases_have_skip_date,
        CASE
            WHEN n_phases_not_marked_skipped_with_skipped_date = 0 THEN 'PASS'
            ELSE 'FAIL'
        END AS skip_dates_exist_only_for_skipped_phases
    FROM
        app_phase_aggregates
)

SELECT
    has_all_phases,
    is_approved_and_has_all_phases_completed_or_skipped,
    all_complete_phases_have_completion_date,
    completion_dates_exist_only_for_completed_phases,
    all_skipped_phases_have_skip_date,
    skip_dates_exist_only_for_skipped_phases,
    count(*) AS n_applications
FROM
    logic_tests
GROUP BY
    has_all_phases,
    is_approved_and_has_all_phases_completed_or_skipped,
    all_complete_phases_have_completion_date,
    completion_dates_exist_only_for_completed_phases,
    all_skipped_phases_have_skip_date,
    skip_dates_exist_only_for_skipped_phases;
