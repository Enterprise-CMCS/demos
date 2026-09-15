-- Warn in cases where we can't link a deliverable to a demonstration

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_delivs_crosswalked_with_no_final_demo') }}
