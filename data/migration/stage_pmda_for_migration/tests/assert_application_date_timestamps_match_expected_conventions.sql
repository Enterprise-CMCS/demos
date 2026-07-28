-- Test that application dates follow start-of-day/end-of-day conventions from constants.ts
-- Returns rows that violate the convention

WITH expected_timestamps AS (
    SELECT
        date_type_id,
        expected_timestamp,
        CASE
            WHEN expected_timestamp = 'Start of Day' THEN '00:00:00.000'::TIME
            WHEN expected_timestamp = 'End of Day' THEN '23:59:59.999'::TIME
        END AS expected_time
    FROM {{ ref('crosswalk_date_type_to_expected_timestamp') }}
),

date_violations AS (
    SELECT
        ad.application_id,
        ad.date_type_id,
        ad.date_value,
        (ad.date_value AT TIME ZONE 'America/New_York')::TIME AS actual_time,
        et.expected_time,
        et.expected_timestamp AS expected_convention
    FROM
        {{ ref('final_demos_app_application_date') }} AS ad
    INNER JOIN expected_timestamps AS et
        ON
            ad.date_type_id = et.date_type_id
    WHERE
        ad.date_value IS NOT NULL
        AND (ad.date_value AT TIME ZONE 'America/New_York')::TIME != et.expected_time
)

SELECT
    application_id,
    date_type_id,
    date_value,
    actual_time,
    expected_time,
    expected_convention,
    'Date timestamp does not match expected ' || expected_convention || ' convention' AS violation_reason
FROM date_violations
ORDER BY application_id, date_type_id
