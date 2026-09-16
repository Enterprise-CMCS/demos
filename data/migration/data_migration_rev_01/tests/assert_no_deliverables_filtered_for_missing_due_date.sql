-- Warn in cases where we had to filter out a deliverable due to a missing due date

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_delivs_crosswalked_with_null_due_date') }}
