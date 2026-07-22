-- Warn in cases where we can't link a deliverable to a demonstration

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_active_crosswaked_pmda_deliverables_with_no_final_demo') }}
