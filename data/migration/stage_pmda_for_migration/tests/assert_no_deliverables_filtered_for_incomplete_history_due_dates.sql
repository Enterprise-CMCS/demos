-- Warn in cases where the due date history of a deliverable could not be generated

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_deliverable_history_with_incomplete_due_date_info') }}
