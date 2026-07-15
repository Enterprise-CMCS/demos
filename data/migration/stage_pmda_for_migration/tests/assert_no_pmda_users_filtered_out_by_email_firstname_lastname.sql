-- Warn in cases where PMDA users were filtered out by email, firstname, or lastname

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_active_pmda_users_with_no_email_firstname_lastname') }}
