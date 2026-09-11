-- Warn in cases where we had to replace the owner of a deliverable with a placeholder

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_delivs_crosswalked_with_null_owner_id') }}
