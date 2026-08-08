-- Warn in cases where we had to filter out demonstration types that had no corresponding finalized demo

{{ config(severity='warn') }}


SELECT * FROM {{ ref('errors_demonstration_types_with_no_finalized_demo') }}
UNION ALL
SELECT * FROM {{ ref('errors_pending_demonstration_types_with_no_in_prog_demo') }}
