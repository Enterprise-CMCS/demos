-- Warn in cases where a finalized extension is filtered for being temp

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_app_finalized_extension_that_are_temp') }}
