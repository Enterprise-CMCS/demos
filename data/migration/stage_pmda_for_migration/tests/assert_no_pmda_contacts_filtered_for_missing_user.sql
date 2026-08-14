-- Warn in cases where a PMDA contact is filtered because it can't be matched to a final user/person

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_apps_pmda_contacts_with_no_resolved_user') }}
