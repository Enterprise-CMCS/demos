-- Warn in cases where a PMDA demo is filtered out by missing a valid state

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_demos_with_missing_invalid_state_code') }}
