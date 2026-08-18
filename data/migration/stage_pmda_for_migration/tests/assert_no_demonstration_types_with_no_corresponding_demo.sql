-- Warn in cases where we had to filter out demonstration types that had no corresponding finalized demo

{{ config(severity='warn') }}


SELECT * FROM {{ ref('errors_demo_type_with_no_demo_finalized') }}
UNION ALL
SELECT * FROM {{ ref('errors_demo_type_with_no_demo_in_prog') }}
