-- Warn in cases where a PMDA contact is filtered because it was assigned to a non-user contact person type

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_apps_pmda_contacts_with_non_user_person_type') }}
