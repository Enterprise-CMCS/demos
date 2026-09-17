SELECT *
FROM {{ ref('final_demos_app_deliverable_extension') }}
WHERE
    original_date_requested IS NULL
    OR (original_date_requested AT TIME ZONE 'America/New_York')::TIME != TIME '23:59:59.999'
    OR (
        -- final_date_granted may be null (and, in this case, expected to be null), but if present it must be EOD
        final_date_granted IS NOT NULL
        AND (final_date_granted AT TIME ZONE 'America/New_York')::TIME != TIME '23:59:59.999'
    )
