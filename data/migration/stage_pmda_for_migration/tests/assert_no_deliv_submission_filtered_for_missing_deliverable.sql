-- Warn in cases where we could not link a submission to a final DEMOS deliverable

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_deliv_submissions_with_no_final_demos_deliv') }}
