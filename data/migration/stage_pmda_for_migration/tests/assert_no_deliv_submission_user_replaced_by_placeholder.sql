-- Warn in cases where we had to replace the submitter with Liz Hill

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_deliv_submissions_with_no_final_demos_user') }}
