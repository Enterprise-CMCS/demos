-- Warn in cases where a PMDA contact is filtered because a state user has a CMS role

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_apps_pmda_contacts_with_state_users_assigned_cms_roles') }}
