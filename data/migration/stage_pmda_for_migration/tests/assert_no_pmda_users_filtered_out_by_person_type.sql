-- Warn in cases where PMDA users were filtered out by missing person_type_id

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_active_pmda_users_with_no_resolved_demos_person_type') }}
