-- Warn in cases where a extension application is filtered for being temp

{{ config(severity='warn') }}

SELECT *
FROM
    {{ ref('errors_extension_applications_that_are_temp') }}
