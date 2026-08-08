-- Warn in cases an application either is missing an effective or expiration 
-- date, or has an effective date that is after the expiration date.

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_pending_demo_type_effective_expiration_dates') }}
UNION ALL
SELECT *
FROM {{ ref('errors_demo_type_effective_expiration_dates') }}
