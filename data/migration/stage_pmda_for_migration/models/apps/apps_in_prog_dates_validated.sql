WITH all_dates AS (
    SELECT
        id,
        mdcd_demo_aplctn_id,
        date_type,
        date_value
    FROM {{ ref('apps_in_prog_dates_unpivoted') }}
),

-- Self-join to get related dates for validation
dates_with_context AS (
    SELECT
        d.*,
        -- Get related dates needed for validation
        max(CASE WHEN d2.date_type = 'Concept Start Date' THEN d2.date_value END) AS concept_start_date,
        max(CASE WHEN d2.date_type = 'Application Intake Start Date' THEN d2.date_value END)
            AS application_intake_start_date,
        max(CASE WHEN d2.date_type = 'Completeness Start Date' THEN d2.date_value END) AS completeness_start_date,
        max(CASE WHEN d2.date_type = 'SDG Preparation Start Date' THEN d2.date_value END) AS sdg_preparation_start_date,
        max(CASE WHEN d2.date_type = 'Approval Package Start Date' THEN d2.date_value END)
            AS approval_package_start_date,
        max(CASE WHEN d2.date_type = 'Review Start Date' THEN d2.date_value END) AS review_start_date,
        max(CASE WHEN d2.date_type = 'State Application Submitted Date' THEN d2.date_value END) AS state_app_submitted,
        max(CASE WHEN d2.date_type = 'Completeness Review Due Date' THEN d2.date_value END) AS completeness_review_due,
        max(CASE WHEN d2.date_type = 'State Application Deemed Complete' THEN d2.date_value END) AS state_app_complete,
        max(CASE WHEN d2.date_type = 'Federal Comment Period Start Date' THEN d2.date_value END) AS fed_comment_start,
        max(CASE WHEN d2.date_type = 'Federal Comment Period End Date' THEN d2.date_value END) AS fed_comment_end
    FROM all_dates AS d
    LEFT JOIN all_dates AS d2
        ON
            d.mdcd_demo_aplctn_id = d2.mdcd_demo_aplctn_id
    GROUP BY d.id, d.mdcd_demo_aplctn_id, d.date_type, d.date_value
)

SELECT
    id,
    mdcd_demo_aplctn_id,
    date_type,
    date_value,

    -- Validation failures (NULL if passed, string describing failures if failed)
    CASE
        -- Concept Completion Date validations
        WHEN date_type = 'Concept Completion Date' AND concept_start_date IS NULL
            THEN 'Missing Concept Start Date'
        WHEN date_type = 'Concept Completion Date' AND date_value < concept_start_date
            THEN 'Before Concept Start Date'

        -- Concept Skipped Date validations
        WHEN date_type = 'Concept Skipped Date' AND concept_start_date IS NULL
            THEN 'Missing Concept Start Date'
        WHEN date_type = 'Concept Skipped Date' AND date_value < concept_start_date
            THEN 'Before Concept Start Date'

        -- Application Intake Completion Date validations
        WHEN date_type = 'Application Intake Completion Date' AND application_intake_start_date IS NULL
            THEN 'Missing Application Intake Start Date'
        WHEN date_type = 'Application Intake Completion Date' AND date_value < application_intake_start_date
            THEN 'Before Application Intake Start Date'

        -- Completeness Completion Date validations
        WHEN date_type = 'Completeness Completion Date' AND completeness_start_date IS NULL
            THEN 'Missing Completeness Start Date'
        WHEN date_type = 'Completeness Completion Date' AND date_value < completeness_start_date
            THEN 'Before Completeness Start Date'

        -- SDG Preparation Completion Date validations
        WHEN date_type = 'SDG Preparation Completion Date' AND sdg_preparation_start_date IS NULL
            THEN 'Missing SDG Preparation Start Date'
        WHEN date_type = 'SDG Preparation Completion Date' AND date_value < sdg_preparation_start_date
            THEN 'Before SDG Preparation Start Date'

        -- Approval Package Completion Date validations
        WHEN date_type = 'Approval Package Completion Date' AND approval_package_start_date IS NULL
            THEN 'Missing Approval Package Start Date'
        WHEN date_type = 'Approval Package Completion Date' AND date_value < approval_package_start_date
            THEN 'Before Approval Package Start Date'

        -- Review Completion Date validations
        WHEN date_type = 'Review Completion Date' AND review_start_date IS NULL
            THEN 'Missing Review Start Date'
        WHEN date_type = 'Review Completion Date' AND date_value < review_start_date
            THEN 'Before Review Start Date'

        -- State Application Submitted Date validations (15 day offset check)
        WHEN date_type = 'State Application Submitted Date' AND completeness_review_due IS NULL
            THEN 'Missing Completeness Review Due Date'
        WHEN
            date_type = 'State Application Submitted Date'
            AND date_value::DATE != (completeness_review_due - INTERVAL '15 days')::DATE
            THEN 'Not 15 days before Completeness Review Due'

        -- Completeness Review Due Date validations (15 day offset check)
        WHEN date_type = 'Completeness Review Due Date' AND state_app_submitted IS NULL
            THEN 'Missing State Application Submitted Date'
        WHEN
            date_type = 'Completeness Review Due Date'
            AND date_value::DATE != (state_app_submitted + INTERVAL '15 days')::DATE
            THEN 'Not 15 days after State Application Submitted'

        -- State Application Deemed Complete validations
        WHEN date_type = 'State Application Deemed Complete' AND state_app_submitted IS NULL
            THEN 'Missing State Application Submitted Date'
        WHEN date_type = 'State Application Deemed Complete' AND date_value < state_app_submitted
            THEN 'Before State Application Submitted'
        WHEN date_type = 'State Application Deemed Complete' AND fed_comment_start IS NULL
            THEN 'Missing Federal Comment Period Start Date'
        WHEN
            date_type = 'State Application Deemed Complete'
            AND date_value::DATE != (fed_comment_start - INTERVAL '1 day')::DATE
            THEN 'Not 1 day before Federal Comment Period Start'

        -- Federal Comment Period Start Date validations
        WHEN date_type = 'Federal Comment Period Start Date' AND state_app_complete IS NULL
            THEN 'Missing State Application Deemed Complete'
        WHEN
            date_type = 'Federal Comment Period Start Date'
            AND date_value::DATE != (state_app_complete + INTERVAL '1 day')::DATE
            THEN 'Not 1 day after State Application Deemed Complete'
        WHEN date_type = 'Federal Comment Period Start Date' AND fed_comment_end IS NULL
            THEN 'Missing Federal Comment Period End Date'
        WHEN
            date_type = 'Federal Comment Period Start Date'
            AND date_value::DATE != (fed_comment_end - INTERVAL '30 days')::DATE
            THEN 'Not 30 days before Federal Comment Period End'

        -- Federal Comment Period End Date validations
        WHEN date_type = 'Federal Comment Period End Date' AND fed_comment_start IS NULL
            THEN 'Missing Federal Comment Period Start Date'
        WHEN
            date_type = 'Federal Comment Period End Date'
            AND date_value::DATE != (fed_comment_start + INTERVAL '30 days')::DATE
            THEN 'Not 30 days after Federal Comment Period Start'

    -- All other date types pass validation
    END AS validation_failures

FROM dates_with_context
